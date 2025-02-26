# app/models/user.py
from sqlalchemy import Boolean, Column, String, Integer
from sqlalchemy.orm import relationship
from app.db.base import BaseModel
import uuid

class User(BaseModel):
    __tablename__ = "users"  # Ensure the table name is correct
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    
    # # Relationships
    # rooms = relationship("Room", back_populates="owner")
    # podcasts = relationship("Podcast", back_populates="creator")