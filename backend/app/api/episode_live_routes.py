# app/api/episode_routes.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from sqlalchemy.orm import Session
from pathlib import Path

from app.api.dependencies import get_db
from app.models import Episode
from app.repositories.episode_repository import episode_repository
from app.schemas.episode import (
    EpisodeResponse, RecordingCreate, RecordingResponse,
    LiveCreate, LiveResponse, EpisodeUpdate
)
from app.utils.file_upload import save_upload_file, delete_file, validate_file_size, validate_file_type
from app.core.config import settings

THUMBNAIL_UPLOAD_DIR = Path("uploads/thumbnails")

router = APIRouter(prefix="/api/v1/episodes/live", tags=["episodes live"])


@router.post("/", response_model=LiveResponse, status_code=status.HTTP_201_CREATED)
async def create_live(
    name: str = Form(...),
    show_id: str = Form(...),
    categories: str = Form(...),
    creator_id: str = Form(...),
    is_active: bool = Form(...),
    thumbnail: UploadFile = File(None),
    db: Session = Depends(get_db)
) -> Any:
    
    # Handle thumbnail upload
    thumbnail_filename = None
    if not thumbnail:
        # If no thumbnail is provided, set a default or handle accordingly
        thumbnail_filename = settings.DEFAULT_THUMBNAIL
    else:
        # Validate thumbnail file
        validate_file_size(thumbnail, settings.MAX_THUMBNAIL_SIZE)
        validate_file_type(thumbnail, settings.ALLOWED_THUMBNAIL_TYPES)
        
        try:
            # Save thumbnail file to the thumbnails directory
            thumbnail_filename = await save_upload_file(thumbnail, THUMBNAIL_UPLOAD_DIR)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not upload thumbnail"
            )
            
    episode_in = LiveCreate(
        name=name,
        show_id=show_id,
        categories=categories,
        is_active=is_active,
    )
            
    episode = episode_repository.create_live(db, obj_in=episode_in, thumbnail=thumbnail_filename, creator_id=creator_id)
    return episode

@router.put("/end_live/{episode_id}", response_model=LiveResponse, status_code=status.HTTP_200_OK)
def end_live(
    episode_id: str,
    creator_id: str,
    db: Session = Depends(get_db),
) -> Any:
    episode = episode_repository.end_live(db, id=episode_id, creator_id=creator_id)
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    return episode

@router.get("/{episode_id}", response_model=LiveResponse)
def get_live_episode(
    episode_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get a live episode by ID.
    """
    episode = episode_repository.get_live(db, id=episode_id)
    if not episode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Live episode not found"
        )
    return episode

@router.get("/", response_model=List[LiveResponse])
def get_all_live_episodes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get all live episodes with pagination.
    """
    episodes = episode_repository.get_all_live(db, skip=skip, limit=limit)
    return episodes

@router.get("/active/", response_model=List[LiveResponse])
def get_all_live_episodes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get all live episodes with pagination.
    """
    episodes = episode_repository.get_active_live(db, skip=skip, limit=limit)
    return episodes