# app/schemas/show.py
from pydantic import BaseModel
from typing import Optional

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
    
    class Config:
        from_attributes = True