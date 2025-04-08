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
        self, db: Session, *, obj_in: RecordingCreate, creator_id: str, thumbnail: Optional[str] = None, video: Optional[str] = None
    ) -> Recording:
        db_obj = Recording(
            name=obj_in.name,
            show_id=obj_in.show_id,
            creator_id=creator_id,
            thumbnail=thumbnail,
            video=video,  # This will now be the filename of the uploaded video
            comments=obj_in.comments,
            categories=obj_in.categories,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_live(
        self, db: Session, *, obj_in: LiveCreate, creator_id: str, thumbnail: Optional[str] = None
    ) -> Live:
        db_obj = Live(
            name=obj_in.name,
            show_id=obj_in.show_id,
            creator_id=creator_id,
            thumbnail=thumbnail,
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
    
    def get_recordings(self, db: Session, skip: int = 0, limit: int = 100) -> List[Recording]:
        """
        Get all episodes with type='recording'.
        """
        return db.query(Recording).offset(skip).limit(limit).all()

    def get_recording(self, db: Session, id: str) -> Optional[Recording]:
        """
        Get a specific recording by ID.
        """
        return db.query(Recording).filter(
            Recording.id == id
        ).first()

    def get_recording_by_name(self, db: Session, name: str) -> Optional[Recording]:
        """
        Get a specific recording by name.
        """
        return db.query(Recording).filter(
            Recording.name == name
        ).first()
    
    def get_live(self, db: Session, id: str) -> Live:
        """
        Get a live episode by ID.
        """
        return db.query(Live).filter(
            Live.id == id,
        ).first()

    def get_all_live(self, db: Session, skip: int = 0, limit: int = 100) -> List[Live]:
        """
        Get all live episodes with pagination.
        """
        return db.query(Live).offset(skip).limit(limit).all()
        
    def get_active_live(self, db: Session, skip: int = 0, limit: int = 100) -> List[Live]:
        """
        Get all active live episodes.
        Only returns Live episodes where is_active=True.
        """
        return db.query(Live).filter(
            Live.is_active == True
        ).offset(skip).limit(limit).all()
    
    def get_categories(self, db: Session) -> List[str]:
        # Get all unique categories from the Episode table as a list like ["Education", "Food"]
        categories = db.query(Episode.categories).distinct().all()
        # Flatten the list of tuples and remove duplicates
        categories = list(set([category for sublist in categories for category in sublist]))
        return categories
        
    
    def get_by_category(self, db: Session, category: str) -> List[Episode]:
        episodes = db.query(Episode).filter(Episode.categories == category).all()
        return episodes
    
episode_repository = EpisodeRepository(Episode)