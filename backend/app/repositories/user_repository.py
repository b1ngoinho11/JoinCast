# app/repositories/user_repository.py
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.user import UserCreate, UserUpdate

class UserRepository(BaseRepository[User]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def get_by_username(self, db: Session, *, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    def create(self, db: Session, *, obj_in: UserCreate, hashed_password: str) -> User:
        db_obj = User(
            email=obj_in.email,
            username=obj_in.username,
            hashed_password=hashed_password,
            is_superuser=obj_in.is_superuser
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    

    def delete(self, db: Session, *, id: str) -> User:
        db_obj = db.get(User, id)
        if db_obj is None:
            # Handle the case where the user does not exist
            raise ValueError(f"User with id {id} does not exist.")
        db.delete(db_obj)
        db.commit()
        return db_obj

# Initialize the repository
user_repository = UserRepository(User)