# app/schemas/show.py
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, ForwardRef

class ShowBase(BaseModel):
    name: str
    description: Optional[str] = None

class ShowCreate(ShowBase):
    pass

class ShowUpdate(ShowBase):
    name: Optional[str] = None

# Minimal show response to avoid circular imports
class ShowMinimalResponse(ShowBase):
    id: str
    creator_id: str
    
    model_config = ConfigDict(from_attributes=True)

# To avoid circular import issues
from app.schemas.episode import EpisodeResponse
from app.schemas.user import UserMinimalResponse

class ShowResponse(ShowBase):
    id: str
    creator_id: str
    creator: Optional[UserMinimalResponse] = None
    episodes: Optional[List["EpisodeResponse"]] = []
    
    model_config = ConfigDict(from_attributes=True)

# Update reference to resolve forward reference
ShowResponse.model_rebuild()