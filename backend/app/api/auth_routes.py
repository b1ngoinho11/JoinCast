# app/api/auth_routes.py
from datetime import datetime, timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.auth import create_access_token, get_current_user
from app.core.security import verify_password, get_password_hash
from app.models.user import User
from app.repositories.user_repository import user_repository
from app.schemas.auth import (
    Token, Login, RefreshToken, PasswordReset,
    PasswordResetConfirm, ChangePassword
)
from app.schemas.user import UserCreate, UserResponse
from app.core.config import settings

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Register a new user.
    """
    # Check if user exists
    if user_repository.get_by_email(db, email=user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    if user_repository.get_by_username(db, username=user_in.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_in.password)
    user = user_repository.create(db, obj_in=user_in, hashed_password=hashed_password)
    
    return user

@router.post("/login", response_model=Token)
def login(
    login_data: Login,
    db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = user_repository.get_by_email(db, email=login_data.email)
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    # Create refresh token
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_access_token(
        data={"sub": user.email},
        expires_delta=refresh_token_expires
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
def refresh_token(
    refresh_token: RefreshToken,
    db: Session = Depends(get_db)
) -> Any:
    """
    Refresh access token.
    """
    try:
        # Verify refresh token and get user
        user = get_current_user(refresh_token.refresh_token, db)
        
        # Create new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=access_token_expires
        )
        
        # Create new refresh token
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        new_refresh_token = create_access_token(
            data={"sub": user.email},
            expires_delta=refresh_token_expires
        )
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/password-reset", status_code=status.HTTP_202_ACCEPTED)
def request_password_reset(
    reset_data: PasswordReset,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> Any:
    """
    Request a password reset token.
    """
    user = user_repository.get_by_email(db, email=reset_data.email)
    if user:
        # Generate password reset token
        token_expires = timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
        reset_token = create_access_token(
            data={"sub": user.email, "type": "reset"},
            expires_delta=token_expires
        )
        
        # TODO: Implement email sending in background task
        # background_tasks.add_task(
        #     send_password_reset_email,
        #     email_to=user.email,
        #     token=reset_token
        # )
    
    # Always return success to prevent email enumeration
    return {"message": "If the email exists, a password reset link will be sent"}

@router.post("/password-reset/confirm")
def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
) -> Any:
    """
    Reset password using reset token.
    """
    try:
        user = get_current_user(reset_data.token, db)
        
        # Update password
        hashed_password = get_password_hash(reset_data.new_password)
        user.password = hashed_password
        db.commit()
        
        return {"message": "Password updated successfully"}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

@router.post("/password-change")
def change_password(
    password_data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Change password while logged in.
    """
    if not verify_password(password_data.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # Update password
    hashed_password = get_password_hash(password_data.new_password)
    current_user.password = hashed_password
    db.commit()
    
    return {"message": "Password updated successfully"}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current user information.
    """
    return current_user

