# app/schemas/episode.py
from pydantic import BaseModel
from typing import Optional, List

class EpisodeBase(BaseModel):
    name: str
    show_id: str
    thumbnail: Optional[str] = None

class EpisodeCreate(EpisodeBase):
    pass

class EpisodeUpdate(EpisodeBase):
    name: Optional[str] = None
    show_id: Optional[str] = None

class EpisodeResponse(EpisodeBase):
    id: str
    creator_id: str
    type: str

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