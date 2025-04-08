# app/api/streaming_routes.py
from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
import os
import mimetypes

from app.api.dependencies import get_db
from app.repositories.episode_repository import episode_repository
from app.utils.episode_file_handler import LIVES_LOG_DIR, SESSIONS_LOG_DIR, LIVE_COMMENTS_LOG_DIR

router = APIRouter(prefix="/api/v1/log", tags=["log"])

@router.get("/live/{episode_id}/speech_log")
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

@router.get("/live/{episode_id}/session_log")
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
    
@router.get("/live/{episode_id}/comments_log")
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