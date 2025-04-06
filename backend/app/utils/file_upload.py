import os
import shutil
from fastapi import UploadFile, HTTPException, status
from pathlib import Path
from uuid import uuid4

def get_file_path(filename: str, upload_dir: Path) -> Path:
    """Get the full path for a file in the specified upload directory."""
    return upload_dir / filename

async def save_upload_file(file: UploadFile, upload_dir: Path) -> str:
    """
    Save an uploaded file to the specified directory and return its filename.
    """
    # Create upload directory if it doesn't exist
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid4()}{file_extension}"
    file_path = get_file_path(unique_filename, upload_dir)
    
    # Save the file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return unique_filename

def delete_file(filename: str, upload_dir: Path) -> None:
    """
    Delete a file from the specified upload directory.
    """
    if filename:
        file_path = get_file_path(filename, upload_dir)
        if file_path.exists():
            file_path.unlink()

def validate_file_size(file: UploadFile, max_size: int) -> None:
    """
    Validate that a file doesn't exceed the maximum size.
    Raises an HTTPException if validation fails.
    """
    if file.size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {max_size/1024/1024:.1f}MB."
        )

def validate_file_type(file: UploadFile, allowed_types: list) -> None:
    """
    Validate that a file has an allowed content type.
    Raises an HTTPException if validation fails.
    """
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types are {', '.join(allowed_types)}."
        )