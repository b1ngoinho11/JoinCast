# app/api/episode_routes.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import logging

from app.api.dependencies import get_db
from app.models import Episode
from app.repositories.episode_repository import episode_repository
from app.schemas.episode import (
    EpisodeResponse, RecordingCreate, RecordingResponse,
    LiveCreate, LiveResponse, EpisodeUpdate
)
import os
from pathlib import Path

THUMBNAIL_PICTURE_UPLOAD_DIR = Path("uploads/thumbnails")

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/episodes", tags=["episodes"])

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
    episode = episode_repository.get(db, id=episode_id)
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    episode_repository.delete(db, id=episode_id)
    
@router.get("/categories/names", response_model=List[str])
def get_episode_categories_names(
    db: Session = Depends(get_db)
) -> List[str]:
    categories = episode_repository.get_categories(db)
    if not categories:
        raise HTTPException(status_code=404, detail="No categories found")
    return categories

@router.get("/categories/{category}", response_model=List[EpisodeResponse])
def get_episodes_by_category(
    category: str,
    db: Session = Depends(get_db)
) -> List[EpisodeResponse]:
    episodes = episode_repository.get_by_category(db, category=category)
    if not episodes:
        raise HTTPException(status_code=404, detail="No episodes found for this category")
    return episodes

@router.get("/thumbnail/{filename}", response_class=FileResponse)
async def get_thumbnail_picture(filename: str):
    file_path = THUMBNAIL_PICTURE_UPLOAD_DIR / filename
    
    # Check if the file exists
    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thumbnail picture not found"
        )
    
    return FileResponse(file_path)

@router.get("/summaries/{episode_id}", response_model=str)
def get_episode_summary(
    episode_id: str,
    db: Session = Depends(get_db)
) -> str:
    episode = episode_repository.get(db, id=episode_id)
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    # Ensure the summary is a valid string
    summary = episode.generate_summary()  # Adjust this line based on your model
    return summary

@router.get("/ai-assistant/{episode_id}", response_model=str)
def get_episode_ai_assistant(
    episode_id: str,
    question: str,
    db: Session = Depends(get_db)
) -> str:
    episode = episode_repository.get(db, id=episode_id)
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    # Ensure the AI assistant response is a valid string
    ai_response = episode.ask_ai_assistant(question=question)
    return ai_response

@router.get("/quiz/{episode_id}", response_model=str)
def get_episode_quiz(
    episode_id: str,
    db: Session = Depends(get_db)
) -> str:
    episode = episode_repository.get(db, id=episode_id)
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    # Ensure the quiz is a valid string
    quiz = episode.generate_quiz()
    return quiz

@router.get('/search/', response_model=List[EpisodeResponse])  # Note: changed to List since you might get multiple
def search_episodes_by_name(
    name: str,  # This will be a query parameter like ?name=catty
    db: Session = Depends(get_db)
) -> List[EpisodeResponse]:
    episodes = episode_repository.get_similar_names(db, name=name)
    if not episodes:
        raise HTTPException(status_code=404, detail="No similar names found")
    return episodes