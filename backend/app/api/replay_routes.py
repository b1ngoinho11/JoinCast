# app/api/streaming_routes.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import mimetypes

from app.api.dependencies import get_db
from app.repositories.episode_repository import episode_repository
from app.utils.episode_file_handler import LIVES_DIR, LIVES_LOG_DIR, SESSIONS_LOG_DIR, LIVE_COMMENTS_LOG_DIR

router = APIRouter(prefix="/api/v1/replay", tags=["replay"])

@router.get("/{episode_id}")
async def get_live_media(episode_id: str, db: Session = Depends(get_db)):
    """
    Get the media file (video/audio) for a live episode.
    Returns the media file with appropriate content type.
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