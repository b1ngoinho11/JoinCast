import os
import shutil
from fastapi import UploadFile
from pathlib import Path
from uuid import uuid4
from app.core.config import settings

UPLOAD_DIR = Path("uploads/profile_pictures")

def get_file_path(filename: str) -> Path:
    """Get the full path for a file in the upload directory."""
    return UPLOAD_DIR / filename

async def save_upload_file(file: UploadFile) -> str:
    """
    Save an uploaded file and return its filename.
    """
    # Create upload directory if it doesn't exist
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid4()}{file_extension}"
    file_path = get_file_path(unique_filename)
    
    # Save the file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return unique_filename

def delete_file(filename: str) -> None:
    """
    Delete a file from the upload directory.
    """
    if filename:
        file_path = get_file_path(filename)
        if file_path.exists():
            file_path.unlink()