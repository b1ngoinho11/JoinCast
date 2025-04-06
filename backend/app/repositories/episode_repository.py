# app/repositories/episode_repository.py
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models import User, Episode, Recording, Live  # Import from the package
from app.repositories.base import BaseRepository
from app.schemas.episode import EpisodeCreate, RecordingCreate, LiveCreate, EpisodeUpdate

class EpisodeRepository(BaseRepository[Episode]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[Episode]:
        return db.query(Episode).filter(Episode.name == name).first()

    def create_recording(
        self, db: Session, *, obj_in: RecordingCreate, creator_id: str, thumbnail: Optional[str] = None
    ) -> Recording:
        db_obj = Recording(
            name=obj_in.name,
            show_id=obj_in.show_id,
            creator_id=creator_id,
            thumbnail=thumbnail,
            video=obj_in.video,
            comments=obj_in.comments,
            categories=obj_in.categories,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_live(
        self, db: Session, *, obj_in: LiveCreate, creator_id: str
    ) -> Live:
        db_obj = Live(
            name=obj_in.name,
            show_id=obj_in.show_id,
            creator_id=creator_id,
            thumbnail=obj_in.thumbnail,
            is_active=obj_in.is_active,
            categories=obj_in.categories,  # Add categories field
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        # Set relationships
        if obj_in.speaker_ids:
            db_obj.speakers = db.query(User).filter(User.id.in_(obj_in.speaker_ids)).all()
        if obj_in.listener_ids:
            db_obj.listeners = db.query(User).filter(User.id.in_(obj_in.listener_ids)).all()
        if obj_in.speaker_request_ids:
            db_obj.speaker_requests = (
                db.query(User).filter(User.id.in_(obj_in.speaker_request_ids)).all()
            )
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Episode, obj_in: EpisodeUpdate) -> Episode:
        update_data = obj_in.dict(exclude_unset=True)
        for field in update_data:
            if field not in ["speaker_ids", "listener_ids", "speaker_request_ids"]:
                setattr(db_obj, field, update_data[field])
        
        if isinstance(db_obj, Live):
            if "speaker_ids" in update_data and update_data["speaker_ids"] is not None:
                db_obj.speakers = (
                    db.query(User).filter(User.id.in_(update_data["speaker_ids"])).all()
                )
            if "listener_ids" in update_data and update_data["listener_ids"] is not None:
                db_obj.listeners = (
                    db.query(User).filter(User.id.in_(update_data["listener_ids"])).all()
                )
            if "speaker_request_ids" in update_data and update_data["speaker_request_ids"] is not None:
                db_obj.speaker_requests = (
                    db.query(User)
                    .filter(User.id.in_(update_data["speaker_request_ids"]))
                    .all()
                )

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, *, id: str) -> Episode:
        db_obj = db.get(Episode, id)
        if db_obj is None:
            raise ValueError(f"Episode with id {id} does not exist.")
        db.delete(db_obj)
        db.commit()
        return db_obj
    
    def end_live(self, db: Session, *, id: str, creator_id:str) -> Live:
        db_obj = db.query(Live).filter(Live.id == id).first()
        if not db_obj:
            raise ValueError(f"Live episode with id {id} does not exist.")
        if db_obj.creator_id != creator_id:
            raise ValueError(f"User with id {creator_id} is not the creator of this episode.")
        db_obj.is_active = False
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    # def get_categories(self, db: Session) -> List[str]:
    #     # Get all unique categories from the Episode table
    #     categories = db.query(Episode).categories.distinct().all()
    #     # Extract the category names from the result
    #     categories = [category[0] for category in categories]
    #     return categories
    
    def get_by_category(self, db: Session, category: str) -> List[Episode]:
        episodes = db.query(Episode).filter(Episode.categories == category).all()
        return episodes
    
episode_repository = EpisodeRepository(Episode)