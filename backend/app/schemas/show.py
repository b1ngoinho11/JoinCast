# app/schemas/show.py
from pydantic import BaseModel
from typing import Optional, List

class ShowBase(BaseModel):
    name: str
    description: Optional[str] = None

class ShowCreate(ShowBase):
    pass

class ShowUpdate(ShowBase):
    name: Optional[str] = None

class ShowResponse(ShowBase):
    id: str
    creator_id: str
    episodes: Optional[List["EpisodeInShow"]] = []
    
    class Config:
        from_attributes = True

# To avoid circular import issues
from app.schemas.episode import EpisodeResponse

class EpisodeInShow(BaseModel):
    id: str
    name: str
    type: str
    thumbnail: Optional[str] = None
    
    class Config:
        from_attributes = True

# Update reference to resolve forward reference
ShowResponse.model_rebuild()