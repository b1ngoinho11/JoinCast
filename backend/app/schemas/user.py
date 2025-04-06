from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
import uuid
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    profile_picture: Optional[str] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    username: str
    password: str
    
    @field_validator('username')
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v
    
    @field_validator('password')
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

# Properties shared by models in DB
class UserInDBBase(UserBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# Properties to return via API
class UserResponse(UserInDBBase):
    # Will be referenced by other schemas but doesn't need to reference others
    pass

# Minimal user response to avoid circular imports
class UserMinimalResponse(BaseModel):
    id: str
    username: str
    profile_picture: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# Properties stored in DB
class UserInDB(UserInDBBase):
    password: str

class ProfilePictureResponse(BaseModel):
    profile_picture: Optional[str] = None
    message: str