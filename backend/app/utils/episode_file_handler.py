# app/utils/episode_file_handler.py
import os
import time
import uuid
import shutil
import subprocess
from fastapi import UploadFile
from typing import Optional, Tuple, Dict, BinaryIO
from datetime import datetime

from openai import OpenAI
from app.core.config import settings

import whisper

# Constants
RECORDING_DIR = "episodes/recordings"
LIVES_DIR = "recordings/lives"
LIVES_LOG_DIR = "recordings/live_logs"
SESSIONS_LOG_DIR = "recordings/session_logs"
LIVE_COMMENTS_LOG_DIR = "recordings/live_comments_logs"

# Create directories if they don't exist
os.makedirs(RECORDING_DIR, exist_ok=True)
os.makedirs(LIVES_DIR, exist_ok=True)
os.makedirs(LIVES_LOG_DIR, exist_ok=True)
os.makedirs(SESSIONS_LOG_DIR, exist_ok=True)
os.makedirs(LIVE_COMMENTS_LOG_DIR, exist_ok=True)

ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg']
ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']
ALLOWED_TYPES = ALLOWED_AUDIO_TYPES + ALLOWED_VIDEO_TYPES
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB max file size

class FileValidationError(Exception):
    """Exception raised when file validation fails."""
    pass

async def save_upload_file(file: UploadFile, episode_id: Optional[str] = None) -> str:
    """
    Save an uploaded file and return the path.
    
    Args:
        file: The uploaded file
        episode_id: The episode ID to associate with the file
        
    Returns:
        The file path
        
    Raises:
        FileValidationError: If file validation fails
    """
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise FileValidationError(f"Unsupported file type: {file.content_type}. Allowed types: {', '.join(ALLOWED_TYPES)}")
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    
    # Use episode_id as filename if provided, otherwise generate a uuid
    if episode_id:
        unique_filename = f"{episode_id}{file_extension}"
    else:
        unique_filename = f"{str(uuid.uuid4())}{file_extension}"
        
    file_path = os.path.join(RECORDING_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        # Use chunks to handle large files
        shutil.copyfileobj(file.file, buffer)
    
    return file_path

def delete_file(file_path: Optional[str]) -> bool:
    """
    Delete a file if it exists.
    
    Args:
        file_path: Path to the file to delete
        
    Returns:
        True if file was deleted, False otherwise
    """
    if not file_path or not os.path.exists(file_path):
        return False
    
    try:
        os.remove(file_path)
        return True
    except (OSError, IOError):
        return False

def start_live_recording(room_id: str, mime_type: str, episode_id: Optional[str] = None) -> Dict:
    """
    Start recording a live session.
    
    Args:
        room_id: The room ID
        mime_type: The MIME type of the recording
        episode_id: The episode ID (optional)
        
    Returns:
        Dict with recording session info
    """
    
    temp_filename = f"{LIVES_DIR}/temp_{episode_id}.webm"
    final_filename = f"{LIVES_DIR}/{episode_id}.wav"
    
    recording_session = {
        'temp_filename': temp_filename,
        'final_filename': final_filename,
        'mime_type': mime_type,
        'file_handle': open(temp_filename, 'wb'),
        'is_recording': True,
        'start_time': datetime.now(),
        'episode_id': episode_id
    }
    
    return recording_session

def add_audio_chunk(file_handle: BinaryIO, audio_data: bytes) -> bool:
    """
    Add an audio chunk to a recording.
    
    Args:
        file_handle: The file handle to write to
        audio_data: The audio data to write
        
    Returns:
        True if successful, False otherwise
    """
    try:
        file_handle.write(audio_data)
        file_handle.flush()
        return True
    except Exception as e:
        print(f"Error writing audio chunk: {e}")
        return False

def stop_live_recording(recording_info: Dict) -> str:
    """
    Stop recording a live session and convert to WAV.
    
    Args:
        recording_info: The recording session info
        
    Returns:
        The path to the final file
    """
    if not recording_info or not recording_info.get('is_recording', False):
        return None
    
    try:
        # Close the temporary file
        recording_info['file_handle'].close()

        # Convert WebM to WAV using FFmpeg
        subprocess.run([
            'ffmpeg',
            '-i', recording_info['temp_filename'],
            '-acodec', 'pcm_s16le',
            '-ar', '44100',
            recording_info['final_filename']
        ], check=True)

        # Remove temporary file
        delete_file(recording_info['temp_filename'])
        
        return recording_info['final_filename']
    except Exception as e:
        print(f"Error processing recording: {e}")
        return None
        
def save_logs(room_id: str, speech_events: list, session_events: list, episode_id: Optional[str] = None) -> Tuple[str, str]:
    """
    Save speech and session events to JSON files.
    
    Args:
        room_id: The room ID
        speech_events: List of speech events
        session_events: List of session events
        episode_id: The episode ID (optional)
        
    Returns:
        Tuple with paths to the speech and session log files
    """
    import json
    
    file_prefix = episode_id if episode_id else f"room_{room_id}"
    
    speech_filename = None
    session_filename = None
    
    # Save speech events
    if speech_events:
        speech_filename = f"{LIVES_LOG_DIR}/recording_log_{file_prefix}.json"
        
        try:
            with open(speech_filename, 'w') as f:
                json.dump({
                    "room_id": room_id,
                    "episode_id": episode_id,
                    "session_end": datetime.now().isoformat(),
                    "events": speech_events
                }, f, indent=2)
            
            print(f"Speech log saved: {speech_filename}")
        except Exception as e:
            print(f"Error saving speech log: {e}")
            speech_filename = None
    
    # Save session events
    if session_events:
        session_filename = f"{SESSIONS_LOG_DIR}/session_log_{file_prefix}.json"
        
        try:
            with open(session_filename, 'w') as f:
                json.dump({
                    "room_id": room_id,
                    "episode_id": episode_id,
                    "session_end": datetime.now().isoformat(),
                    "events": session_events
                }, f, indent=2)
            
            print(f"Session log saved: {session_filename}")
        except Exception as e:
            print(f"Error saving session log: {e}")
            session_filename = None
    
    return speech_filename, session_filename

def start_live_recording(room_id: str, mime_type: str, episode_id: Optional[str] = None) -> Dict:
    """
    Start recording a live session with video support.
    """
    temp_filename = f"{LIVES_DIR}/temp_{episode_id}.webm"
    final_filename = f"{LIVES_DIR}/{episode_id}.mp4"  # Changed to mp4 for better compatibility
    
    recording_session = {
        'temp_filename': temp_filename,
        'final_filename': final_filename,
        'mime_type': mime_type,
        'file_handle': open(temp_filename, 'wb'),
        'is_recording': True,
        'start_time': datetime.now(),
        'episode_id': episode_id,
        'has_video': 'video' in mime_type  # Track if this is a video recording
    }
    
    return recording_session

def add_video_chunk(file_handle: BinaryIO, video_data: bytes) -> bool:
    """Add a video chunk to a recording"""
    return add_audio_chunk(file_handle, video_data)  # Same implementation for now

def stop_live_recording(recording_info: Dict) -> str:
    """Stop recording a live session and convert to final format."""
    if not recording_info or not recording_info.get('is_recording', False):
        return None
    
    try:
        # Close the temporary file
        recording_info['file_handle'].close()

        # Convert to final format
        if recording_info['has_video']:
            # For video recordings, convert to MP4
            subprocess.run([
                'ffmpeg',
                '-i', recording_info['temp_filename'],
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                recording_info['final_filename']
            ], check=True)
        else:
            # For audio-only, convert to WAV
            subprocess.run([
                'ffmpeg',
                '-i', recording_info['temp_filename'],
                '-acodec', 'pcm_s16le',
                '-ar', '44100',
                recording_info['final_filename']
            ], check=True)

        # Remove temporary file
        delete_file(recording_info['temp_filename'])
        
        return recording_info['final_filename']
    except Exception as e:
        print(f"Error processing recording: {e}")
        return None
    
def create_temp_recording(recording_info: Dict) -> Optional[str]:
    """
    Create a temporary recording file in MP4 format from the current recording session without stopping it.
    
    Args:
        recording_info: The recording session info
        
    Returns:
        The path to the temporary MP4 file, or None if failed
    """
    if not recording_info or not recording_info.get('is_recording', False):
        return None
    
    try:
        # Generate temporary file names
        temp_filename = recording_info['temp_filename']
        base_name = os.path.splitext(os.path.basename(temp_filename))[0]
        temp_summary_filename = f"{LIVES_DIR}/summary_{base_name}.mp4"  # Changed to .mp4
        
        # Flush current file handle to ensure all data is written
        recording_info['file_handle'].flush()
        
        # Convert the current temp WebM file to MP4 using FFmpeg
        subprocess.run([
            'ffmpeg',
            '-i', temp_filename,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-y',  # Overwrite output file if it exists
            temp_summary_filename
        ], check=True)
        
        print(f"Temporary MP4 recording saved: {temp_summary_filename}")
        return temp_summary_filename
    except Exception as e:
        print(f"Error creating temporary MP4 recording: {e}")
        return None
    
def save_chat_logs(room_id: str, chat_messages: list, episode_id: Optional[str] = None) -> str:
    """
    Save chat messages to a JSON file.
    
    Args:
        room_id: The room ID
        chat_messages: List of chat messages
        episode_id: The episode ID (optional)
        
    Returns:
        Path to the chat log file
    """
    import json
    
    file_prefix = episode_id if episode_id else f"room_{room_id}"
    chat_filename = f"{LIVE_COMMENTS_LOG_DIR}/chat_log_{file_prefix}.json"
    
    try:
        with open(chat_filename, 'w') as f:
            json.dump({
                "room_id": room_id,
                "episode_id": episode_id,
                "session_end": datetime.now().isoformat(),
                "messages": chat_messages
            }, f, indent=2)
        
        print(f"Chat log saved: {chat_filename}")
        return chat_filename
    except Exception as e:
        print(f"Error saving chat log: {e}")
        return None

def transcribe_temp_recording(file_path: str) -> str:
    """
    Extract audio from a temporary recording using FFmpeg, transcribe it with Whisper,
    and generate a structured summary using DeepSeek AI.
    
    Args:
        file_path: Path to the temporary recording file (MP4)
        
    Returns:
        A string containing the transcription followed by the summary, separated by a delimiter
        
    Raises:
        Exception: If extraction, transcription, or summarization fails
    """
    audio_path = None
    try:
        # Generate audio output path
        audio_path = f"{os.path.splitext(file_path)[0]}_audio.mp3"
        print(f"Extracting audio from {file_path} to {audio_path}")
        
        # Extract audio using FFmpeg
        result = subprocess.run([
            'ffmpeg',
            '-i', file_path,
            '-vn',  # No video
            '-acodec', 'mp3',
            '-y',  # Overwrite output if exists
            audio_path
        ], check=True, stderr=subprocess.PIPE, text=True)
        
        # Verify audio file exists and is non-empty
        if not os.path.exists(audio_path):
            raise Exception(f"Audio file {audio_path} was not created")
        if os.path.getsize(audio_path) == 0:
            raise Exception(f"Audio file {audio_path} is empty")
        
        print(f"Audio file exists: {audio_path}, size: {os.path.getsize(audio_path)} bytes")
        
        # Load Whisper model and transcribe
        print(f"Loading Whisper model 'turbo'")
        start_time = time.time()
        model = whisper.load_model("turbo")
        print(f"Transcribing {audio_path}")
        transcription_result = model.transcribe(audio_path)
        
        end_time = time.time()
        print(f"Transcription took {end_time - start_time:.2f} seconds")
        
        # Format transcription to match transcribe_media() output
        transcription_text = ""
        for segment in transcription_result['segments']:
            start = time.strftime('%H:%M:%S', time.gmtime(segment['start']))
            end = time.strftime('%H:%M:%S', time.gmtime(segment['end']))
            transcription_text += f"[{start} --> {end}] {segment['text']}\n"
        
        print(f"Transcription result length: {len(transcription_text)} characters")
        
        # Generate summary using DeepSeek AI
        if not transcription_text:
            summary = "No transcript available"
        else:
            print("Generating summary with DeepSeek AI")
            try:
                # Initialize OpenAI client with OpenRouter base URL
                client = OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=settings.OPENROUTER_API_KEY,
                )
                
                # Call DeepSeek AI for summarization
                completion = client.chat.completions.create(
                    extra_body={},
                    model="deepseek/deepseek-chat-v3-0324:free",
                    messages=[
                        {
                            "role": "user",
                            "content": f"""
                            Create two outputs for this video transcript:

                            1. A structured summary with the following format:
                            
                            # [Main Title]
                            
                            **Main Topic (Timestamp: XX:XX:XX - XX:XX:XX)** – [Brief overview]. 
                            – [Key point 1]
                            – [Key point 2]
                            
                            **Key Details**
                            – [Important detail 1]
                            – [Important detail 2]

                            2. A timestamp navigation table in this format:
                            [TIMESTAMP_NAVIGATION]
                            - [XX:XX:XX] Topic description
                            - [XX:XX:XX] Another topic
                            - [XX:XX:XX] Key point
                            [/TIMESTAMP_NAVIGATION]
                            
                            Formatting rules:
                            1. Use # only for the main title
                            2. Use **double asterisks** for section headers only
                            3. Use – for bullet points (not -)
                            4. Bold important terms within sentences with **double asterisks**
                            5. Keep each bullet point on one line
                            6. Don't use markdown symbols except as specified above
                            7. Don't include any "let me know" or similar AI helper text
                            
                            Transcript:
                            {transcription_text}
                            """
                        }
                    ]
                )
                
                summary = completion.choices[0].message.content
                print(f"Summary generated, length: {len(summary)} characters")
            except Exception as e:
                summary = f"Summary generation error: {str(e)}"
                print(f"Summary generation failed: {str(e)}")
        
        # Combine transcription and summary with a clear delimiter
        combined_output = f"=== Transcription ===\n{transcription_text.strip()}\n\n=== Summary ===\n{summary}"
        
        # Clean up audio file after successful transcription and summarization
        print(f"Cleaning up audio file: {audio_path}")
        if os.path.exists(audio_path):
            os.remove(audio_path)
            print(f"Audio file deleted: {audio_path}")
        else:
            print(f"Audio file {audio_path} already deleted or never existed")
        
        # Optionally clean up the MP4 file
        # delete_file(file_path)
        
        return combined_output
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg error: {e.stderr}")
        if audio_path and os.path.exists(audio_path):
            print(f"Cleaning up audio file due to FFmpeg error: {audio_path}")
            os.remove(audio_path)
        raise Exception(f"Failed to extract audio: {e.stderr}")
    except Exception as e:
        print(f"Processing error: {str(e)}")
        if audio_path and os.path.exists(audio_path):
            print(f"Cleaning up audio file due to error: {audio_path}")
            os.remove(audio_path)
        raise Exception(f"Failed to process temporary recording: {str(e)}")
    finally:
        # Ensure cleanup even if unexpected errors occur
        if audio_path and os.path.exists(audio_path):
            print(f"Audio file still exists in finally block, cleaning up: {audio_path}")
            os.remove(audio_path)