from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import mimetypes
import ffmpeg

from app.api.dependencies import get_db
from app.repositories.episode_repository import episode_repository
from app.utils.episode_file_handler import LIVES_DIR, LIVES_LOG_DIR, SESSIONS_LOG_DIR, LIVE_COMMENTS_LOG_DIR, transcribe_temp_recording

router = APIRouter(prefix="/api/v1/replay", tags=["replay"])

def has_video_stream(file_path: str) -> bool:
    """
    Check if the MP4 file has a video stream using ffprobe.
    Returns True if a video stream exists, False otherwise.
    """
    if not file_path.lower().endswith('.mp4'):
        return False  # Only check MP4 files
    try:
        probe = ffmpeg.probe(file_path, select_streams='v')
        return len(probe.get('streams', [])) > 0  # True if video streams exist
    except ffmpeg.Error as e:
        print(f"Error checking video stream for {file_path}: {e.stderr.decode()}")
        return True  # Default to video if analysis fails
    except Exception as e:
        print(f"Unexpected error checking video stream for {file_path}: {e}")
        return True  # Default to video if analysis fails

@router.get("/{episode_id}")
async def get_live_media(episode_id: str, db: Session = Depends(get_db)):
    """
    Get the media file (video/audio) for a live episode.
    Returns the media file with appropriate content type.
    If an MP4 file has no video stream, treat it as audio.
    """
    episode = episode_repository.get(db, id=episode_id)
    if not episode or episode.type != "live":
        raise HTTPException(status_code=404, detail="Live episode not found")
    
    # Find the media file with common video/audio extensions
    media_extensions = ('.mp4', '.webm', '.m4a', '.mp3', '.wav')
    media_files = [
        f for f in os.listdir(LIVES_DIR) 
        if f.startswith(episode_id) and f.lower().endswith(media_extensions)
    ]
    
    if not media_files:
        raise HTTPException(status_code=404, detail="No media file found for this live episode")
    
    # Get the media file path
    media_file = media_files[0]
    file_path = os.path.join(LIVES_DIR, media_file)
    
    # Determine the content type
    content_type, _ = mimetypes.guess_type(file_path)
    if not content_type:
        content_type = 'application/octet-stream'
    
    # Special handling for MP4 files: check if they have a video stream
    if media_file.lower().endswith('.mp4'):
        if not has_video_stream(file_path):
            content_type = 'audio/mp4'  # Treat as audio if no video stream
    
    print(f"Serving file: {file_path} with content type: {content_type}")
    
    return FileResponse(
        path=file_path,
        media_type=content_type,
        filename=media_file
    )

@router.get("/{episode_id}/speech_log")
async def get_live_speech_log(episode_id: str, db: Session = Depends(get_db)):
    """
    Get the speech log for a live episode.
    Returns the JSON file containing speech events.
    """
    episode = episode_repository.get(db, id=episode_id)
    if not episode or episode.type != "live":
        raise HTTPException(status_code=404, detail="Live episode not found")
    
    # Find the speech log file
    log_files = [f for f in os.listdir(LIVES_LOG_DIR) if f.startswith(f"recording_log_{episode_id}")]
    if not log_files:
        raise HTTPException(status_code=404, detail="No speech log found for this live episode")
    
    # Return the most recent log file
    log_file = sorted(log_files)[-1]
    return FileResponse(
        os.path.join(LIVES_LOG_DIR, log_file),
        media_type="application/json"
    )

@router.get("/{episode_id}/session_log")
async def get_live_session_log(episode_id: str, db: Session = Depends(get_db)):
    """
    Get the session log for a live episode.
    Returns the JSON file containing session events.
    """
    episode = episode_repository.get(db, id=episode_id)
    if not episode or episode.type != "live":
        raise HTTPException(status_code=404, detail="Live episode not found")
    
    # Find the session log file
    log_files = [f for f in os.listdir(SESSIONS_LOG_DIR) if f.startswith(f"session_log_{episode_id}")]
    if not log_files:
        raise HTTPException(status_code=404, detail="No session log found for this live episode")
    
    # Return the most recent log file
    log_file = sorted(log_files)[-1]
    return FileResponse(
        os.path.join(SESSIONS_LOG_DIR, log_file),
        media_type="application/json"
    )
    
@router.get("/{episode_id}/comments_log")
async def get_live_comments_log(episode_id: str, db: Session = Depends(get_db)):
    """
    Get the comments log for a live episode.
    Returns the JSON file containing comments events.
    """
    episode = episode_repository.get(db, id=episode_id)
    if not episode or episode.type != "live":
        raise HTTPException(status_code=404, detail="Live episode not found")
    
    # Find the comments log file
    log_files = [f for f in os.listdir(LIVE_COMMENTS_LOG_DIR) if f.startswith(f"chat_log_{episode_id}")]
    if not log_files:
        raise HTTPException(status_code=404, detail="No comments log found for this live episode")
    
    # Return the most recent log file
    log_file = sorted(log_files)[-1]
    return FileResponse(
        os.path.join(LIVE_COMMENTS_LOG_DIR, log_file),
        media_type="application/json"
    )
    
@router.get("/{episode_id}/transcribe")
async def transcribe_live_recording(episode_id: str, db: Session = Depends(get_db)):
    """
    Transcribe the latest temporary or final recording for a live episode.
    Returns the transcription and summary as plain text.
    """
    episode = episode_repository.get(db, id=episode_id)
    if not episode or episode.type != "live":
        raise HTTPException(status_code=404, detail="Live episode not found")

    # Look for temporary recording first, then fall back to final recording
    temp_file = f"{LIVES_DIR}/summary_temp_{episode_id}.mp4"
    final_file = f"{LIVES_DIR}/{episode_id}.mp4"
    file_path = temp_file if os.path.exists(temp_file) else final_file

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="No recording file found for transcription")

    try:
        # Call transcribe_temp_recording from episode_file_handler
        result = transcribe_temp_recording(file_path)
        return {"transcription": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")