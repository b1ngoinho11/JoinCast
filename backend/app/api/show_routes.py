# app/api/show_routes.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models import Show
from app.repositories.show_repository import show_repository
from app.schemas.show import ShowCreate, ShowResponse, ShowUpdate

router = APIRouter(prefix="/api/v1/shows", tags=["shows"])

@router.post("/", response_model=ShowResponse, status_code=status.HTTP_201_CREATED)
def create_show(
    show_in: ShowCreate,
    creator_id: str,  # Assume this is passed in the request for simplicity
    db: Session = Depends(get_db)
) -> Any:
    """
    Create a new show.
    """
    # Check if show with this name already exists
    show = show_repository.get_by_name(db, name=show_in.name)
    if show:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A show with this name already exists"
        )
    
    # Create show
    show = show_repository.create(db, obj_in=show_in, creator_id=creator_id)
    return show

@router.get("/", response_model=List[ShowResponse])
def list_shows(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    List all shows in the system.
    """
    shows = show_repository.get_multi(db, skip=skip, limit=limit)
    return shows

@router.get("/{show_id}", response_model=ShowResponse)
def get_show(
    show_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get show by ID.
    """
    show = show_repository.get(db, id=show_id)
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Show not found"
        )
    return show

@router.get("/by-name/{name}", response_model=ShowResponse)
def get_show_by_name(
    name: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get show by name.
    """
    show = show_repository.get_by_name(db, name=name)
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Show not found"
        )
    return show