# app/api/user_routes.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pathlib import Path
from fastapi.responses import FileResponse
import os

from app.api.dependencies import get_db
from app.models import User
from app.repositories.user_repository import user_repository
from app.schemas.user import UserCreate, UserResponse, UserUpdate, ProfilePictureResponse
from app.core.security import get_password_hash
from app.utils.file_upload import save_upload_file, delete_file
from app.core.auth import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/api/v1/users", tags=["users"])

PROFILE_PICTURE_UPLOAD_DIR = Path("uploads/profile_pictures")

@router.get("/", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    List all users in the system.
    """
    users = user_repository.get_multi(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get user by ID.
    """
    user = user_repository.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.get("/by-email/{email}", response_model=UserResponse)
def get_user_by_email(
    email: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get user by email.
    """
    user = user_repository.get_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.post("/me/profile-picture", response_model=ProfilePictureResponse)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Upload a profile picture for the current user.
    """
    print(f"Uploading file: {file.filename}, size: {file.size}, type: {file.content_type}")
    
    # Validate file size
    if file.size > settings.MAX_PROFILE_PICTURE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB."
        )
    
    # Validate file type
    if file.content_type not in settings.ALLOWED_PROFILE_PICTURE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed types are JPEG, PNG, and GIF."
        )
    
    
    try:
        # Delete old profile picture if it exists
        if current_user.profile_picture:
            delete_file(current_user.profile_picture, PROFILE_PICTURE_UPLOAD_DIR)
        
        # Save new profile picture to the profile pictures directory
        filename = await save_upload_file(file, PROFILE_PICTURE_UPLOAD_DIR)
        
        # Update user record
        current_user.profile_picture = filename
        db.commit()
        
        return {
            "profile_picture": filename,
            "message": "Profile picture updated successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not upload file"
        )

@router.delete("/me/profile-picture", response_model=ProfilePictureResponse)
async def delete_profile_picture(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Delete the current user's profile picture.
    """
    if not current_user.profile_picture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No profile picture found"
        )
    
    try:
        # Delete the file from the profile pictures directory
        delete_file(current_user.profile_picture, PROFILE_PICTURE_UPLOAD_DIR)
        
        # Update user record
        current_user.profile_picture = None
        db.commit()
        
        return {
            "profile_picture": None,
            "message": "Profile picture deleted successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not delete profile picture"
        )

@router.get("/profile-picture/{filename}", response_class=FileResponse)
async def get_profile_picture(filename: str):
    """
    Serve a user's profile picture by filename.
    """
    file_path = PROFILE_PICTURE_UPLOAD_DIR / filename
    
    # Check if the file exists
    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile picture not found"
        )
    
    return FileResponse(file_path)
