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

router = APIRouter(prefix="/api/v1/episodes/live", tags=["episodes live"])


@router.post("/", response_model=LiveResponse, status_code=status.HTTP_201_CREATED)
def create_live(
    episode_in: LiveCreate,
    creator_id: str,
    db: Session = Depends(get_db)
) -> Any:
    episode = episode_repository.create_live(db, obj_in=episode_in, creator_id=creator_id)
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
