# app/api/episode_routes.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pathlib import Path

from app.api.dependencies import get_db
from app.models import Episode
from app.repositories.episode_repository import episode_repository
from app.schemas.episode import (
    EpisodeResponse, RecordingCreate, RecordingResponse,
    LiveCreate, LiveResponse, EpisodeUpdate
)
from app.utils.file_upload import save_upload_file, delete_file
from app.core.config import settings

THUMBNAIL_UPLOAD_DIR = Path("uploads/thumbnails")

router = APIRouter(prefix="/api/v1/episodes/recording", tags=["episodes recording"])

@router.post("/", response_model=RecordingResponse, status_code=status.HTTP_201_CREATED)
async def create_recording(
    episode_in: RecordingCreate,
    creator_id: str,  # Assume passed in request; integrate auth later
    thumbnail: UploadFile = File(...),  # Add thumbnail parameter
    db: Session = Depends(get_db)
) -> Any:
    """
    Create a new recording with an optional thumbnail picture.
    """
    # Validate file size
    if thumbnail.size > settings.MAX_THUMBNAIL_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB."
        )
    
    # Validate file type
    if thumbnail.content_type not in settings.ALLOWED_THUMBNAIL_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed types are JPEG, PNG, and GIF."
        )
    
    try:
        # Save thumbnail file to the thumbnails directory
        thumbnail_filename = await save_upload_file(thumbnail, THUMBNAIL_UPLOAD_DIR)
        
        # Create recording with thumbnail
        episode = episode_repository.create_recording(
            db, obj_in=episode_in, creator_id=creator_id, thumbnail=thumbnail_filename
        )
        return episode
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not upload thumbnail"
        )


