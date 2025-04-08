# app/api/episode_routes.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pathlib import Path
import os
from fastapi.responses import FileResponse

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
VIDEO_UPLOAD_DIR = Path("uploads/videos")

router = APIRouter(prefix="/api/v1/episodes/recording", tags=["episodes recording"])

@router.post("/", response_model=RecordingResponse, status_code=status.HTTP_201_CREATED)
async def create_recording(
    name: str = Form(...),
    show_id: str = Form(...),
    categories: str = Form(...),
    comments: str = Form(None),
    creator_id: str = Form(...),
    thumbnail: UploadFile = File(None),
    video: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> Any:
    """
    Create a new recording with an uploaded video file and optional thumbnail picture.
    """
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
    
    # Handle video upload
    video_filename = None
    # Validate video file
    validate_file_size(video, settings.MAX_VIDEO_SIZE)
    validate_file_type(video, settings.ALLOWED_VIDEO_TYPES)
    
    try:
        # Save video file to the videos directory
        video_filename = await save_upload_file(video, VIDEO_UPLOAD_DIR)
    except Exception as e:
        # Clean up the thumbnail if it was uploaded
        if thumbnail_filename and thumbnail_filename != settings.DEFAULT_THUMBNAIL:
            delete_file(thumbnail_filename, THUMBNAIL_UPLOAD_DIR)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not upload video"
        )
    
    # Create the RecordingCreate object from form fields and uploaded files
    episode_in = RecordingCreate(
        name=name,
        show_id=show_id,
        categories=categories,
        # video=video_filename,  # Save the filename, not the actual video
        comments=comments
    )
    
    # Create recording with thumbnail and video
    episode = episode_repository.create_recording(
        db, obj_in=episode_in, creator_id=creator_id, thumbnail=thumbnail_filename, video=video_filename
    )
    return episode

@router.get("/", response_model=List[RecordingResponse])
async def get_recordings(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get a list of recordings with pagination.
    Only returns episodes with type='recording'.
    """
    episodes = episode_repository.get_recordings(db, skip=skip, limit=limit)
    return episodes

@router.get("/{episode_id}", response_model=RecordingResponse)
async def get_recording(
    episode_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get a recording by its ID.
    Only returns episode if type='recording'.
    """
    episode = episode_repository.get_recording(db, id=episode_id)
    if not episode:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")
    return episode

#get by name
@router.get("/name/{name}", response_model=RecordingResponse)
async def get_recording_by_name(
    name: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get a recording by its name.
    Only returns episode if type='recording'.
    """
    episode = episode_repository.get_recording_by_name(db, name=name)
    if not episode:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")
    return episode

@router.put("/{episode_id}", response_model=RecordingResponse)
async def update_recording(
    episode_id: str,
    episode_update: EpisodeUpdate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Update a recording by its ID.
    """
    episode = episode_repository.get(db, id=episode_id)
    if not episode:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")
    
    updated_episode = episode_repository.update(db, db_obj=episode, obj_in=episode_update)
    return updated_episode

@router.delete("/{episode_id}", response_model=RecordingResponse)
async def delete_recording(
    episode_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Delete a recording by its ID.
    """
    episode = episode_repository.get(db, id=episode_id)
    if not episode:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")
    
    deleted_episode = episode_repository.delete(db, id=episode_id)
    
    # Optionally clean up the uploaded files
    if deleted_episode.thumbnail and deleted_episode.thumbnail != settings.DEFAULT_THUMBNAIL:
        delete_file(deleted_episode.thumbnail, THUMBNAIL_UPLOAD_DIR)
    
    if deleted_episode.video:
        delete_file(deleted_episode.video, VIDEO_UPLOAD_DIR)
    
    return deleted_episode

# get video
@router.get("/video/{filename}", response_class=FileResponse)
async def get_video(filename: str):
    file_path = VIDEO_UPLOAD_DIR / filename
    
    # Check if the file exists
    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    return FileResponse(file_path)



