import os
from pydantic import PostgresDsn, field_validator, AnyHttpUrl
from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Your Project Name"
    API_V1_STR: str = "/api/v1"
    
    # Database settings
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: str = "5432"
    DATABASE_URI: PostgresDsn | None = None

    @field_validator("DATABASE_URI", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info) -> str:
        if isinstance(v, str):
            return v
            
        # Get values from the validation context
        values = info.data

        # Manually construct the DSN string
        return f"postgresql://{values.get('POSTGRES_USER')}:{values.get('POSTGRES_PASSWORD')}@" \
               f"{values.get('POSTGRES_SERVER')}:{values.get('POSTGRES_PORT')}/" \
               f"{values.get('POSTGRES_DB')}"
    
    # # OAuth settings
    # OAUTH_PROVIDERS: List[str] = ["google"]  # Add more providers as needed
    
    # # Google OAuth
    # GOOGLE_CLIENT_ID: str
    # GOOGLE_CLIENT_SECRET: str
    # GOOGLE_REDIRECT_URI: str
    
    # JWT settings for session management
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # openrouter settings
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    
    # Security settings
    VERIFY_EMAIL: bool = True
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 48
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []
    
    # File upload settings
    UPLOAD_DIR: Path = Path("uploads")
    DEFAULT_PROFILE_PICS_DIR: Path = Path("static/default_profile_pics")
    MAX_PROFILE_PICTURE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_PROFILE_PICTURE_TYPES: List[str] = ["image/jpeg", "image/png", "image/gif"]
    
    # Thumbnail settings
    DEFAULT_THUMBNAIL: str = "default_thumbnail.png"
    MAX_THUMBNAIL_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_THUMBNAIL_TYPES: List[str] = ["image/jpeg", "image/png", "image/gif"]
    
    # recording video settings
    MAX_VIDEO_SIZE: int = 500 * 1024 * 1024  # 500MB
    ALLOWED_VIDEO_TYPES: List[str] = ["video/mp4", "video/x-ms-wmv", "video/x-msvideo", "video/x-flv", "video/quicktime", 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg']
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()

# Initialize settings
settings = Settings()