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

def create_user():
    # Create a new database session
    db = SessionLocal()
    
    try:
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
        
    finally:
        db.close()

def list_all_users():
    # Create a new database session
    db = SessionLocal()
    
    try:
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
            
    finally:
        db.close()

def delete_user(user_id: int):
    # Create a new database session
    db = SessionLocal()
    
    try:
        # Get the user by ID
        user = user_repository.get(db, id=user_id)
        
        if not user:
            print(f"User not found: ID {user_id}")
            return
            
        # Delete the user
        user_repository.delete(db, id=user_id)
        print(f"Deleted user: {user.username} (ID: {user.id})")
        
    finally:
        db.close()

def delete_all_user():
    # Create a new database session
    db = SessionLocal()
    
    try:
        # Get all users from database
        users = db.query(User).all()
        
        if not users:
            print("No users found in database.")
            return
            
        print("\n--- Deleting All Users in Database ---")
        for user in users:
            print(f"Deleting user: {user.username} (ID: {user.id})")
            user_repository.delete(db, id=user.id)
            
    finally:
        db.close()

if __name__ == "__main__":
    
    # # delete all user
    delete_all_user()
    
    # Create a test user
    user = create_user()
    
    # # List all users in the database
    list_all_users()
    
    # # wish_to_delete = input("Do you want to delete a user? (y/n): ")
    # # if wish_to_delete.lower() == "y":
    # #     user_id = str(input("Enter the user ID to delete: "))
    # #     delete_user(user_id)
    # #     list_all_users()
    delete_user(user.id)

