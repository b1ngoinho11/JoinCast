# app/api/streaming_routes.py
from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
import os
import mimetypes

from app.api.dependencies import get_db
from app.repositories.episode_repository import episode_repository
from app.models import Episode
from app.utils.episode_file_handler import RECORDING_DIR, LIVES_DIR, LIVES_LOG_DIR, SESSIONS_LOG_DIR

router = APIRouter(prefix="/api/v1/stream", tags=["streaming"])

@router.get("/episode/{episode_id}")
async def stream_episode(episode_id: str, request: Request, db: Session = Depends(get_db)):
    """
    Stream the audio/video content of an episode.
    Supports range requests for partial content (streaming).
    """
    episode = episode_repository.get(db, id=episode_id)
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    # Determine file path based on episode type
    if episode.type == "recording":
        if not hasattr(episode, "video") or not episode.video:
            raise HTTPException(status_code=404, detail="No media file found for this recording")
        file_path = episode.video
    elif episode.type == "live":
        # For live episodes, we'll use the final WAV file
        # You might want to modify this based on your live recording naming convention
        live_files = [f for f in os.listdir(LIVES_DIR) if f.startswith(episode_id)]
        if not live_files:
            raise HTTPException(status_code=404, detail="No recording found for this live episode")
        file_path = os.path.join(LIVES_DIR, live_files[0])
    else:
        raise HTTPException(status_code=400, detail="Unsupported episode type")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Media file not found")
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    # Handle range requests
    range_header = request.headers.get('Range')
    if range_header:
        # Parse range header
        start, end = 0, None
        range_ = range_header.split('=')[1]
        if '-' in range_:
            start, end = range_.split('-')
            start = int(start)
            end = int(end) if end else file_size - 1
        
        # Calculate content length
        content_length = end - start + 1 if end else file_size - start
        
        # Open file in binary mode and seek to start position
        file = open(file_path, 'rb')
        file.seek(start)
        
        # Determine content type
        content_type, _ = mimetypes.guess_type(file_path)
        
        # Create streaming response with partial content
        response = StreamingResponse(
            file,
            media_type=content_type,
            status_code=206
        )
        response.headers['Content-Range'] = f'bytes {start}-{end if end else file_size-1}/{file_size}'
        response.headers['Accept-Ranges'] = 'bytes'
        response.headers['Content-Length'] = str(content_length)
        
        return response
    else:
        # Return full file if no range requested
        return FileResponse(
            file_path,
            media_type=mimetypes.guess_type(file_path)[0],
            headers={'Accept-Ranges': 'bytes'}
        )

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