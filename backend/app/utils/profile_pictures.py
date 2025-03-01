import random
import os
from pathlib import Path
from shutil import copyfile
from app.core.config import settings

DEFAULT_PICS_DIR = Path("static/default_profile_pics")

def get_random_default_picture() -> str:
    """
    Get a random default profile picture and copy it to user uploads directory.
    Returns the filename of the copied picture.
    """
    # Get list of default profile pictures
    default_pics = list(DEFAULT_PICS_DIR.glob('*.png'))  # or whatever extension you use
    if not default_pics:
        raise FileNotFoundError("No default profile pictures found")
    
    # Select random picture
    random_pic = random.choice(default_pics)
    
    # Generate unique filename for the copy
    new_filename = f"default_{os.path.basename(random_pic)}"
    destination = settings.UPLOAD_DIR / "profile_pictures" / new_filename
    
    # Create directory if it doesn't exist
    destination.parent.mkdir(parents=True, exist_ok=True)
    
    # Copy the file
    copyfile(random_pic, destination)
    
    return new_filename 