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

def transcribe_media(media_path, output_txt=None):
    """Transcribe audio or video file and optionally save to text file"""
    start_time = time.time()
    
    # Check if the file is a video
    _, ext = os.path.splitext(media_path)
    is_video = ext.lower() in ['.mp4', '.avi', '.mov', '.mkv']
    
    # If it's a video, extract audio first
    if is_video:
        audio_path = f"{os.path.splitext(media_path)[0]}.mp3"
        extract_audio_from_video(media_path, audio_path)
        # Get video duration
        video = VideoFileClip(media_path)
        duration = video.duration
        video.close()
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
    processing_time = end_time - start_time
    
    # Save transcript to file if requested
    if output_txt:
        with open(output_txt, 'w') as f:
            for segment in result['segments']:
                start = time.strftime('%H:%M:%S', time.gmtime(segment['start']))
                end = time.strftime('%H:%M:%S', time.gmtime(segment['end']))
                f.write(f"[{start} --> {end}] {segment['text']}\n")

    
    # Calculate and print performance metrics
    print(f"Media duration: {duration:.2f} seconds")
    print(f"Processing time: {processing_time:.2f} seconds")
    print(f"Processing ratio: {processing_time/duration:.2f}x real-time")
    
    return result["text"]

if __name__ == "__main__":
    media_file = "48826adc-9ec6-475b-8f4d-12f10d5aa703.mov"
    
    output_file = f"{os.path.splitext(media_file)[0]}_transcript.txt"
    transcript = transcribe_media(media_file, output_file)
    print(transcript)
