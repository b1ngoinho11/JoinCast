# app/schemas/episode.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class EpisodeBase(BaseModel):
    name: str
    show_id: str
    categories: Optional[str] = None  # Add categories field

class EpisodeCreate(EpisodeBase):
    pass

class EpisodeUpdate(EpisodeBase):
    name: Optional[str] = None
    show_id: Optional[str] = None
    thumbnail: Optional[str] = None  # Add thumbnail to update schema
    categories: Optional[str] = None  # Make sure it's optional in updates too

class EpisodeResponse(EpisodeBase):
    id: str
    creator_id: str
    type: str
    thumbnail: Optional[str] = None  # Keep thumbnail in response
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class RecordingCreate(EpisodeCreate):
    video: Optional[str] = None
    comments: Optional[str] = None

class RecordingUpdate(EpisodeUpdate):
    video: Optional[str] = None
    comments: Optional[str] = None

class RecordingResponse(EpisodeResponse):
    video: Optional[str] = None
    comments: Optional[str] = None

class LiveCreate(EpisodeCreate):
    is_active: bool = True
    speaker_ids: Optional[List[str]] = []
    listener_ids: Optional[List[str]] = []
    speaker_request_ids: Optional[List[str]] = []

class LiveUpdate(EpisodeUpdate):
    is_active: Optional[bool] = None
    speaker_ids: Optional[List[str]] = None
    listener_ids: Optional[List[str]] = None
    speaker_request_ids: Optional[List[str]] = None

class LiveResponse(EpisodeResponse):
    is_active: bool
    speaker_ids: Optional[List[str]] = []
    listener_ids: Optional[List[str]] = []
    speaker_request_ids: Optional[List[str]] = []
    # speaker_ids: List[str]
    # listener_ids: List[str]
    # speaker_request_ids: List[str]