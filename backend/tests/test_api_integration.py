import os
import sys
from pathlib import Path
import uuid
import pytest
import requests
from time import sleep

# Add the project root to the Python path
project_root = str(Path(__file__).parents[1])
sys.path.append(project_root)

from app.core.config import settings
from app.db.session import SessionLocal
from app.repositories.user_repository import user_repository

# Base URL for API testing
BASE_URL = f"http://localhost:8000/api/v1"

@pytest.fixture
def db_session():
    """Provide a SQLAlchemy session for tests"""
    db = SessionLocal()
    yield db
    db.close()

def test_api_user_registration():
    """Unit test for user registration API endpoint"""
    unique_id = uuid.uuid4().hex[:8]
    test_email = f"test.user.{unique_id}@example.com"
    test_username = f"testuser_{unique_id}"
    
    # Test user registration
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": test_email,
            "username": test_username,
            "password": "Password123!"
        }
    )
    
    assert response.status_code == 200, f"Registration failed: {response.text}"
    data = response.json()
    assert "id" in data, "Registration response missing user ID"
    assert data["email"] == test_email, "Registration email mismatch"
    
    # Clean up - use db session directly since this is a testing utility
    db = SessionLocal()
    try:
        user = user_repository.get_by_email(db, email=test_email)
        if user:
            user_repository.delete(db, id=user.id)
    finally:
        db.close()

def test_api_login_and_me_integration():
    """Integration test for login and me endpoints"""
    unique_id = uuid.uuid4().hex[:8]
    test_email = f"test.integration.{unique_id}@example.com"
    test_username = f"integration_{unique_id}"
    test_password = "SecurePass123!"
    
    # 1. Register a user
    register_response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": test_email,
            "username": test_username,
            "password": test_password
        }
    )
    assert register_response.status_code == 200, f"Registration failed: {register_response.text}"
    
    # 2. Login with the user
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": test_email,
            "password": test_password
        }
    )
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    tokens = login_response.json()
    assert "access_token" in tokens, "Login response missing access token"
    
    # 3. Get user profile using the token
    me_response = requests.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert me_response.status_code == 200, f"Me endpoint failed: {me_response.text}"
    user_data = me_response.json()
    assert user_data["email"] == test_email, "Email mismatch in profile"
    assert user_data["username"] == test_username, "Username mismatch in profile"
    
    # 4. Clean up
    db = SessionLocal()
    try:
        user = user_repository.get_by_email(db, email=test_email)
        if user:
            user_repository.delete(db, id=user.id)
    finally:
        db.close()

def test_system_api_workflow():
    """System test for complete API workflow including user, auth, and shows"""
    unique_id = uuid.uuid4().hex[:8]
    test_email = f"system.test.{unique_id}@example.com"
    test_username = f"systemtest_{unique_id}"
    test_password = "SystemTestPass123!"
    
    # 1. Register a new user
    register_response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": test_email,
            "username": test_username,
            "password": test_password
        }
    )
    assert register_response.status_code == 200, f"Registration failed: {register_response.text}"
    user_id = register_response.json()["id"]
    
    # 2. Login to get access token
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": test_email,
            "password": test_password
        }
    )
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    tokens = login_response.json()
    access_token = tokens["access_token"]
    
    # 3. Create a new show
    show_name = f"System Test Show {unique_id}"
    create_show_response = requests.post(
        f"{BASE_URL}/shows/",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "name": show_name,
            "description": "A system test show"
        }
    )
    assert create_show_response.status_code == 200, f"Show creation failed: {create_show_response.text}"
    show_data = create_show_response.json()
    show_id = show_data["id"]
    
    # 4. Get the show details
    get_show_response = requests.get(
        f"{BASE_URL}/shows/{show_id}",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert get_show_response.status_code == 200, f"Get show failed: {get_show_response.text}"
    assert get_show_response.json()["name"] == show_name, "Show name mismatch"
    
    # 5. Update the show
    updated_name = f"Updated {show_name}"
    update_show_response = requests.put(
        f"{BASE_URL}/shows/{show_id}",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "name": updated_name,
            "description": "An updated system test show"
        }
    )
    assert update_show_response.status_code == 200, f"Update show failed: {update_show_response.text}"
    assert update_show_response.json()["name"] == updated_name, "Show name not updated"
    
    # 6. Get user shows to confirm the show is associated
    user_shows_response = requests.get(
        f"{BASE_URL}/users/{user_id}/shows",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert user_shows_response.status_code == 200, f"Get user shows failed: {user_shows_response.text}"
    shows = user_shows_response.json()
    assert any(show["id"] == show_id for show in shows), "Show not found in user's shows"
    
    # 7. Delete the show
    delete_show_response = requests.delete(
        f"{BASE_URL}/shows/{show_id}",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert delete_show_response.status_code == 200, f"Delete show failed: {delete_show_response.text}"
    
    # 8. Verify the show is deleted
    get_deleted_show_response = requests.get(
        f"{BASE_URL}/shows/{show_id}",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert get_deleted_show_response.status_code == 404, "Show was not deleted properly"
    
    # 9. Clean up the user
    db = SessionLocal()
    try:
        user = user_repository.get_by_email(db, email=test_email)
        if user:
            user_repository.delete(db, id=user.id)
    finally:
        db.close()

if __name__ == "__main__":
    print("Running API integration tests...")
    test_api_user_registration()
    print("✓ User registration API test passed")
    
    test_api_login_and_me_integration()
    print("✓ Login and Me API integration test passed")
    
    test_system_api_workflow()
    print("✓ System API workflow test passed")
    
    print("All API tests completed successfully!")
