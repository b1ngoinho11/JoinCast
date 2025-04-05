# app/utils/episode_file_handler.py
import os
import uuid
import shutil
import subprocess
from fastapi import UploadFile
from typing import Optional, Tuple, Dict, BinaryIO
from datetime import datetime

# Constants
RECORDING_DIR = "episodes/recordings"
LIVES_DIR = "episodes/lives"
LIVES_LOG_DIR = "episodes/live_logs"
SESSIONS_LOG_DIR = "episodes/session_logs"

# Create directories if they don't exist
os.makedirs(RECORDING_DIR, exist_ok=True)
os.makedirs(LIVES_DIR, exist_ok=True)
os.makedirs(LIVES_LOG_DIR, exist_ok=True)
os.makedirs(SESSIONS_LOG_DIR, exist_ok=True)

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