import shutil
from pathlib import Path
from app.core.config import settings

def init_default_profile_pics():
    """
    Initialize default profile pictures from a source directory.
    You can run this during application setup or deployment.
    """
    source_dir = Path("initial_assets/default_profile_pics")
    target_dir = settings.DEFAULT_PROFILE_PICS_DIR
    
    # Create target directory if it doesn't exist
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy all default profile pictures
    for pic in source_dir.glob('*.png'):  # or whatever extension you use
        shutil.copy(pic, target_dir / pic.name)

if __name__ == "__main__":
    init_default_profile_pics() 