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

@pytest.fixture
def db_session():
    """Provide a SQLAlchemy session for tests"""
    db = SessionLocal()
    yield db
    db.close()

def test_create_user(db_session):
    """Test user creation"""
    email = "pytestuser@gmail.com"
    existing_user = user_repository.get_by_email(db_session, email=email)
    
    if existing_user:
        assert existing_user.email == email
        return

    user_data = UserCreate(
        email=email,
        username="pytestuser",
        password="password",
        is_superuser=False
    )
    hashed_password = get_password_hash(user_data.password)
    new_user = user_repository.create(
        db=db_session,
        obj_in=user_data,
        hashed_password=hashed_password
    )

    assert new_user.email == email, "User creation failed"

def test_list_all_users(db_session):
    """Ensure listing users works"""
    users = db_session.query(User).all()
    assert isinstance(users, list), "Users should be returned as a list"

def test_delete_user(db_session):
    """Test deleting a user"""
    email = "pytestuser@gmail.com"
    user = user_repository.get_by_email(db_session, email=email)
    
    if user:
        user_repository.delete(db_session, id=user.id)
        deleted_user = user_repository.get(db_session, id=user.id)
        assert deleted_user is None, "User was not deleted"

def test_get_user_by_username(db_session):
    """Unit test: Test getting a user by username"""
    username = "pytestuser"
    email = "pytestuser@gmail.com"
    
    # Create a test user if it doesn't exist
    existing_user = user_repository.get_by_email(db_session, email=email)
    if not existing_user:
        user_data = UserCreate(
            email=email,
            username=username,
            password="password",
            is_superuser=False
        )
        hashed_password = get_password_hash(user_data.password)
        user_repository.create(
            db=db_session,
            obj_in=user_data,
            hashed_password=hashed_password
        )
    
    # Test function
    user = user_repository.get_by_username(db_session, username=username)
    assert user is not None, "Failed to get user by username"
    assert user.username == username, "Username doesn't match"

def test_update_user_integration(db_session):
    """Integration test: Test updating a user's information"""
    # Setup - create or get test user
    email = "integration_test@example.com"
    username = "integration_user"
    
    existing_user = user_repository.get_by_email(db_session, email=email)
    if not existing_user:
        user_data = UserCreate(
            email=email,
            username=username,
            password="password",
            is_superuser=False
        )
        hashed_password = get_password_hash(user_data.password)
        user = user_repository.create(
            db=db_session,
            obj_in=user_data,
            hashed_password=hashed_password
        )
    else:
        user = existing_user
    
    # Test updating the user
    new_username = "updated_user"
    updated_user = user_repository.update(
        db=db_session,
        db_obj=user,
        obj_in={"username": new_username}
    )
    
    # Verify the update was successful
    assert updated_user.username == new_username, "Username update failed"
    
    # Check that database has the updated record
    refreshed_user = user_repository.get(db_session, id=user.id)
    assert refreshed_user.username == new_username, "Username update not persisted"
    
    # Cleanup - restore original username
    user_repository.update(
        db=db_session,
        db_obj=refreshed_user,
        obj_in={"username": username}
    )

def test_user_system_flow(db_session):
    """System test: Test the entire user lifecycle flow"""
    # 1. Create a unique test user
    test_email = f"system_test_{os.urandom(4).hex()}@example.com"
    test_username = f"system_user_{os.urandom(4).hex()}"
    test_password = "secure_password123"
    
    # Create user data
    user_data = UserCreate(
        email=test_email,
        username=test_username,
        password=test_password,
        is_superuser=False
    )
    hashed_password = get_password_hash(user_data.password)
    
    # 2. Register the user
    new_user = user_repository.create(
        db=db_session,
        obj_in=user_data,
        hashed_password=hashed_password
    )
    assert new_user is not None, "User creation failed"
    assert new_user.email == test_email, "Email mismatch"
    assert new_user.username == test_username, "Username mismatch"
    
    # 3. Verify user can be found by email
    found_user = user_repository.get_by_email(db_session, email=test_email)
    assert found_user is not None, "User not found by email"
    assert found_user.id == new_user.id, "User ID mismatch"
    
    # 4. Update user information
    updated_username = f"updated_{test_username}"
    updated_user = user_repository.update(
        db=db_session,
        db_obj=found_user,
        obj_in={"username": updated_username}
    )
    assert updated_user.username == updated_username, "Username update failed"
    
    # 5. Delete the user
    deleted_user = user_repository.delete(db_session, id=found_user.id)
    assert deleted_user.id == found_user.id, "Wrong user deleted"
    
    # 6. Verify user is gone
    gone_user = user_repository.get(db_session, id=found_user.id)
    assert gone_user is None, "User was not properly deleted"

def create_user(db):
    # Create a new database session
    # db = SessionLocal()
    
    # try:
        # Check if the test user already exists
        existing_user = user_repository.get_by_email(db, email="panda@tidmee.com")
        
        if existing_user:
            print(f"User already exists: {existing_user.username} (ID: {existing_user.id})")
            return existing_user
            
        # Create user data using Pydantic model
        user_data = UserCreate(
            email="panda@tidmee.com",
            username="panda",
            password="password",
            # is_superuser=False
        )
        
        # Hash the password
        hashed_password = get_password_hash(user_data.password)
        
        # Create the user using repository
        new_user = user_repository.create(
            db=db,
            obj_in=user_data,
            hashed_password=hashed_password
        )
        
        print(f"Created new user: {new_user.username} (ID: {new_user.id})")
        return new_user
        
    # finally:
    #     db.close()

def list_all_users(db):
    # Create a new database session
    # db = SessionLocal()
    
    # try:
        # Get all users from database
        users = db.query(User).all()
        
        if not users:
            print("No users found in database.")
            return
            
        print("\n--- All Users in Database ---")
        for user in users:
            print(f"ID: {user.id}")
            print(f"Username: {user.username}")
            print(f"Email: {user.email}")
            print(f"Password: {user.password}")
            print(f"Created: {user.created_at}")
            print(f"Updated: {user.updated_at}")
            print("-" * 30)
            
    # finally:
    #     db.close()

def delete_user(db, user_id: int):
    # Create a new database session
    # db = SessionLocal()
    
    # try:
        # Get the user by ID
        user = user_repository.get(db, id=user_id)
        
        if not user:
            print(f"User not found: ID {user_id}")
            return
            
        # Delete the user
        user_repository.delete(db, id=user_id)
        print(f"Deleted user: {user.username} (ID: {user.id})")
        
    # finally:
    #     db.close()

def delete_all_user(db):
    # Create a new database session
    # db = SessionLocal()
    
    # try:
        # Get all users from database
        users = db.query(User).all()
        
        if not users:
            print("No users found in database.")
            return
            
        print("\n--- Deleting All Users in Database ---")
        for user in users:
            print(f"Deleting user: {user.username} (ID: {user.id})")
            user_repository.delete(db, id=user.id)
            
    # finally:
    #     db.close()

if __name__ == "__main__":
    db = SessionLocal()
    # Create a test user
    try:
        
        user = create_user(db)
        
        # # List all users in the database
        list_all_users(db)
        
        # # wish_to_delete = input("Do you want to delete a user? (y/n): ")
        # # if wish_to_delete.lower() == "y":
        # #     user_id = str(input("Enter the user ID to delete: "))
        # #     delete_user(user_id)
        # #     list_all_users()
        delete_user(db, user.id)
    finally:
        db.close()

