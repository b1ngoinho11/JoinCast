# app/api/episode_routes.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models import Episode
from app.repositories.episode_repository import episode_repository
from app.schemas.episode import (
    EpisodeResponse, RecordingCreate, RecordingResponse,
    LiveCreate, LiveResponse, EpisodeUpdate
)

router = APIRouter(prefix="/api/v1/episodes", tags=["episodes"])

@router.post("/recording", response_model=RecordingResponse, status_code=status.HTTP_201_CREATED)
def create_recording(
    episode_in: RecordingCreate,
    creator_id: str,  # Assume passed in request; integrate auth later
    db: Session = Depends(get_db)
) -> Any:
    episode = episode_repository.create_recording(db, obj_in=episode_in, creator_id=creator_id)
    return episode

@router.post("/live", response_model=LiveResponse, status_code=status.HTTP_201_CREATED)
def create_live(
    episode_in: LiveCreate,
    creator_id: str,
    db: Session = Depends(get_db)
) -> Any:
    episode = episode_repository.create_live(db, obj_in=episode_in, creator_id=creator_id)
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
    episode = episode_repository.get(db, id=episode_id)
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    episode_repository.delete(db, id=episode_id)