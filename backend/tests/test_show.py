import os
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = str(Path(__file__).parents[1])
sys.path.append(project_root)

import pytest

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.models.show import Show
from app.core.security import get_password_hash
from app.repositories.user_repository import user_repository
from app.schemas.user import UserCreate

from app.schemas.show import ShowCreate
from app.repositories.show_repository import show_repository
from test_user import create_user, list_all_users


@pytest.fixture
def db_session():
    """Provide a SQLAlchemy session for tests"""
    db = SessionLocal()
    yield db
    db.close()
    
def test_delete_show(db, show):
    show_id = show.id
    deleted_show = show_repository.delete(db=db, id=show_id)
    assert deleted_show.id == show_id

def test_create_show(db):
    show_data = ShowCreate(name="TestShow99", description="A test show")
    new_show = show_repository.create(db=db, obj_in=show_data, creator_id=user.id)
    assert new_show.creator_id == user.id
    return new_show

if __name__ == "__main__":
    # Create a test user
    try:
        db = SessionLocal()
        user = create_user(db)
        test_create_show(db)
        
        print("\n--- User's Shows ---")
        for show in user.shows:
            print(show)
            
        test_delete_show(db, show)
        
        print("\n--- User's Shows After Delete ---")
        for show in user.shows:
            print(show)
    finally:
        db.close()
