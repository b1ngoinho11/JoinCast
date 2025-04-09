import whisper
import os
from moviepy import VideoFileClip
import sys
import time

def extract_audio_from_video(video_path, audio_output_path):
    """Extract audio from video file and save it as mp3"""
    video = VideoFileClip(video_path)
    video.audio.write_audiofile(audio_output_path)
    return audio_output_path

def delete_audio_file(audio_path):
    """Delete the audio file after processing"""
    if os.path.exists(audio_path):
        os.remove(audio_path)
    else:
        print(f"The file {audio_path} does not exist and cannot be deleted.")
    return True

def transcribe_media(media_path):
    """Transcribe audio or video file and optionally save to text file"""
    # start_time = time.time()
    
    # Check if the file is a video or already an MP3
    _, ext = os.path.splitext(media_path)
    is_video = ext.lower() in ['.mp4', '.avi', '.mov', '.mkv']
    is_mp3 = ext.lower() in ['.mp3', '.m4a', '.wav', '.flac']
    
    # If it's a video, extract audio first
    if is_video:
        audio_path = f"{os.path.splitext(media_path)[0]}.mp3"
        extract_audio_from_video(media_path, audio_path)
        # Get video duration
        video = VideoFileClip(media_path)
        duration = video.duration
        video.close()
    elif is_mp3:
        audio_path = media_path
        # Get audio duration
        audio = VideoFileClip(audio_path)
        duration = audio.duration
        audio.close()
    else:
        audio_path = media_path
        # Get audio duration
        audio = VideoFileClip(audio_path)
        duration = audio.duration
        audio.close()
    
    # Load the Whisper model and transcribe
    model = whisper.load_model("turbo")
    result = model.transcribe(audio_path)
    
    end_time = time.time()
    # processing_time = end_time - start_time
    
    return_text = ""
    
    # Save transcript to file if requested
    for segment in result['segments']:
        start = time.strftime('%H:%M:%S', time.gmtime(segment['start']))
        end = time.strftime('%H:%M:%S', time.gmtime(segment['end']))
        return_text += f"[{start} --> {end}] {segment['text']}\n"
        
    # Clean up audio file if it was created
    delete_audio_file(audio_path)
    
    return return_text.strip()  # Ensure no trailing newlines
