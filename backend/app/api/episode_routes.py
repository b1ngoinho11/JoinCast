# app/api/episode_routes.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models import Episode
from app.repositories.episode_repository import episode_repository
from app.schemas.episode import (
    EpisodeResponse, RecordingCreate, RecordingResponse,
    LiveCreate, LiveResponse, EpisodeUpdate
)
from app.utils.episode_file_handler import save_upload_file, delete_file, FileValidationError
import json
import uuid

router = APIRouter(prefix="/api/v1/episodes", tags=["episodes"])

@router.post("/recording", response_model=RecordingResponse, status_code=status.HTTP_201_CREATED)
async def create_recording(
    name: str = Form(...),
    show_id: str = Form(...),
    creator_id: str = Form(...),  # Assume passed in request; integrate auth later
    thumbnail: str = Form(None),
    comments: str = Form(None),
    media_file: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> Any:
    """
    Create a new recording with file upload.
    
    - **name**: Name of the episode
    - **show_id**: ID of the show this episode belongs to
    - **creator_id**: ID of the user creating the episode
    - **thumbnail**: Optional thumbnail URL
    - **comments**: Optional comments
    - **media_file**: Audio or video file (MP3, WAV, OGG, MP4, WebM)
    """
    try:
        # Generate episode ID beforehand
        episode_id = str(uuid.uuid4())
        
        # Save the uploaded file with the episode_id
        file_path = await save_upload_file(media_file, episode_id)
        
        # Create recording schema
        episode_in = RecordingCreate(
            name=name,
            show_id=show_id,
            thumbnail=thumbnail,
            video=file_path,  # Use the file path in the video field
            comments=comments
        )
        
        # Create the recording with pre-generated ID
        episode = episode_repository.create_recording(
            db, 
            obj_in=episode_in, 
            creator_id=creator_id,
            episode_id=episode_id
        )
        return episode
        
    except FileValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating recording: {str(e)}"
        )

@router.post("/live", response_model=LiveResponse, status_code=status.HTTP_201_CREATED)
def create_live(
    episode_in: LiveCreate,
    creator_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Create a new live episode.
    
    Returns the created live episode with a unique ID that can be used to connect to WebSocket.
    """
    # Generate episode ID beforehand
    episode_id = str(uuid.uuid4())
    
    # Create the live episode with pre-generated ID
    episode = episode_repository.create_live(
        db, 
        obj_in=episode_in, 
        creator_id=creator_id,
        episode_id=episode_id
    )
    
    return episode

@router.get("/", response_model=List[EpisodeResponse])
def list_episodes(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    episodes = episode_repository.get_multi(db, skip=skip, limit=limit)
    return episodes

@router.get("/{episode_id}", response_model=EpisodeResponse)
def get_episode(
    episode_id: str,
    db: Session = Depends(get_db)
) -> Any:
    episode = episode_repository.get(db, id=episode_id)
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    return episode

@router.put("/{episode_id}", response_model=EpisodeResponse)
def update_episode(
    episode_id: str,
    episode_in: EpisodeUpdate,
    db: Session = Depends(get_db)
) -> Any:
    episode = episode_repository.get(db, id=episode_id)
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    episode = episode_repository.update(db, db_obj=episode, obj_in=episode_in)
    return episode

@router.delete("/{episode_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_episode(
    episode_id: str,
    db: Session = Depends(get_db)
) -> None:
    """
    Delete an episode and its associated file if it's a recording.
    """
    episode = episode_repository.get(db, id=episode_id)
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    # Handle file deletion for recordings
    if episode.type == "recording" and hasattr(episode, "video") and episode.video:
        delete_file(episode.video)
    
    # Delete the episode from database
    episode_repository.delete(db, id=episode_id)