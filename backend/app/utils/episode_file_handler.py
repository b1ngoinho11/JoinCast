# app/utils/episode_file_handler.py
import os
import uuid
import shutil
from fastapi import UploadFile
from typing import Optional, Tuple

# Constants
RECORDING_DIR = "episodes/recordings"
os.makedirs(RECORDING_DIR, exist_ok=True)

ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg']
ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']
ALLOWED_TYPES = ALLOWED_AUDIO_TYPES + ALLOWED_VIDEO_TYPES
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB max file size

class FileValidationError(Exception):
    """Exception raised when file validation fails."""
    pass

async def save_upload_file(file: UploadFile, episode_id: Optional[str] = None) -> str:
    """
    Save an uploaded file and return the path.
    
    Args:
        file: The uploaded file
        episode_id: The episode ID to associate with the file
        
    Returns:
        The file path
        
    Raises:
        FileValidationError: If file validation fails
    """
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise FileValidationError(f"Unsupported file type: {file.content_type}. Allowed types: {', '.join(ALLOWED_TYPES)}")
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    
    # Use episode_id as filename if provided, otherwise generate a uuid
    if episode_id:
        unique_filename = f"{episode_id}{file_extension}"
    else:
        unique_filename = f"{str(uuid.uuid4())}{file_extension}"
        
    file_path = os.path.join(RECORDING_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        # Use chunks to handle large files
        shutil.copyfileobj(file.file, buffer)
    
    return file_path

def delete_file(file_path: Optional[str]) -> bool:
    """
    Delete a file if it exists.
    
    Args:
        file_path: Path to the file to delete
        
    Returns:
        True if file was deleted, False otherwise
    """
    if not file_path or not os.path.exists(file_path):
        return False
    
    try:
        os.remove(file_path)
        return True
    except (OSError, IOError):
        return False