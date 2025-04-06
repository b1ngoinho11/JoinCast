# app/repositories/show_repository.py
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.show import Show
from app.models.episode import Episode
from app.repositories.base import BaseRepository
from app.schemas.show import ShowCreate, ShowUpdate

class ShowRepository(BaseRepository[Show]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[Show]:
        return db.query(Show).filter(Show.name == name).first()

    def create(self, db: Session, *, obj_in: ShowCreate, creator_id: str) -> Show:
        db_obj = Show(
            name=obj_in.name,
            description=obj_in.description,
            creator_id=creator_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, *, id: str) -> Show:
        db_obj = db.get(Show, id)
        if db_obj is None:
            raise ValueError(f"Show with id {id} does not exist.")
        db.delete(db_obj)
        db.commit()
        return db_obj

    def get_with_episodes(self, db: Session, *, id: str) -> Optional[Show]:
        """Get a show with all its episodes."""
        show = db.query(Show).filter(Show.id == id).first()
        if not show:
            return None
        
        # Episodes are already loaded through the relationship
        # This is just to ensure we have the relationship loaded eagerly
        return show
    
    def get_episodes(self, db: Session, *, id: str) -> List[Episode]:
        """Get all episodes for a show."""
        show = self.get(db, id=id)
        if not show:
            return []
        
        return show.episodes

# Initialize the repository
show_repository = ShowRepository(Show)