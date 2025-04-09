import os
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = str(Path(__file__).parents[1])
sys.path.append(project_root)

import pytest
import uuid

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.models.show import Show
from app.core.security import get_password_hash
from app.repositories.user_repository import user_repository
from app.schemas.user import UserCreate

from app.schemas.show import ShowCreate, ShowUpdate
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

def test_get_show_by_id(db_session):
    """Unit test: Test retrieving a show by ID"""
    # Create a test user
    test_user = create_user(db_session)
    
    # Create a test show
    show_name = f"Test Show {uuid.uuid4()}"
    show_data = ShowCreate(name=show_name, description="A unit test show")
    new_show = show_repository.create(db=db_session, obj_in=show_data, creator_id=test_user.id)
    
    # Test getting the show by ID
    retrieved_show = show_repository.get(db=db_session, id=new_show.id)
    assert retrieved_show is not None, "Failed to retrieve show by ID"
    assert retrieved_show.name == show_name, "Show name mismatch"
    assert retrieved_show.creator_id == test_user.id, "Creator ID mismatch"
    
    # Clean up
    show_repository.delete(db=db_session, id=new_show.id)

def test_show_user_integration(db_session):
    """Integration test: Test the relationship between shows and users"""
    # Create a test user
    test_user = create_user(db_session)
    
    # Create multiple shows for the user
    show_count = 3
    created_shows = []
    
    for i in range(show_count):
        show_data = ShowCreate(
            name=f"Integration Test Show {i}",
            description=f"Show #{i} for integration testing"
        )
        show = show_repository.create(
            db=db_session, 
            obj_in=show_data,
            creator_id=test_user.id
        )
        created_shows.append(show)
    
    # Test that all shows appear in the user's shows relationship
    user_shows = db_session.query(User).filter(User.id == test_user.id).first().shows
    assert len(user_shows) >= show_count, "User doesn't have expected number of shows"
    
    # Verify each created show is related to the user
    for show in created_shows:
        assert any(s.id == show.id for s in user_shows), f"Show {show.id} not found in user's shows"
    
    # Update one of the shows
    updated_name = "Updated Integration Show"
    show_update = ShowUpdate(name=updated_name)
    updated_show = show_repository.update(
        db=db_session,
        db_obj=created_shows[0],
        obj_in=show_update
    )
    assert updated_show.name == updated_name, "Show update failed"
    
    # Clean up
    for show in created_shows:
        show_repository.delete(db=db_session, id=show.id)

def test_show_system_workflow(db_session):
    """System test: Test the complete show lifecycle with user interaction"""
    # 1. Create a system test user with a unique identifier
    unique_id = os.urandom(4).hex()
    email = f"system_test_{unique_id}@example.com"
    username = f"system_user_{unique_id}"
    
    user_data = UserCreate(
        email=email,
        username=username,
        password="password123"
    )
    hashed_password = get_password_hash(user_data.password)
    test_user = user_repository.create(
        db=db_session,
        obj_in=user_data,
        hashed_password=hashed_password
    )
    
    # 2. Create a show for the user
    show_name = f"System Test Show {unique_id}"
    show_desc = "A comprehensive system test show"
    show_data = ShowCreate(name=show_name, description=show_desc)
    
    new_show = show_repository.create(
        db=db_session,
        obj_in=show_data,
        creator_id=test_user.id
    )
    assert new_show is not None, "Show creation failed"
    assert new_show.name == show_name, "Show name mismatch"
    
    # 3. Update the show information
    updated_name = f"Updated {show_name}"
    updated_desc = f"Updated description for {unique_id}"
    show_update = ShowUpdate(name=updated_name, description=updated_desc)
    
    updated_show = show_repository.update(
        db=db_session,
        db_obj=new_show,
        obj_in=show_update
    )
    assert updated_show.name == updated_name, "Show name update failed"
    assert updated_show.description == updated_desc, "Show description update failed"
    
    # 4. Verify the show appears in user's shows
    refreshed_user = user_repository.get(db=db_session, id=test_user.id)
    user_shows = [show for show in refreshed_user.shows if show.id == new_show.id]
    assert len(user_shows) == 1, "Show not properly associated with user"
    assert user_shows[0].name == updated_name, "Show in user relationship not updated"
    
    # 5. Delete the show
    deleted_show = show_repository.delete(db=db_session, id=new_show.id)
    assert deleted_show.id == new_show.id, "Wrong show deleted"
    
    # 6. Verify the show is removed from user's shows
    refreshed_user = user_repository.get(db=db_session, id=test_user.id)
    user_shows = [show for show in refreshed_user.shows if show.id == new_show.id]
    assert len(user_shows) == 0, "Show not properly removed from user relationship"
    
    # 7. Clean up the user
    user_repository.delete(db=db_session, id=test_user.id)

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
