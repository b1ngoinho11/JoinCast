# app/models/user.py
from sqlalchemy import Boolean, Column, String, Integer
from sqlalchemy.orm import relationship
from app.db.base import BaseModel
import uuid

class User(BaseModel):
    __tablename__ = "users"  # Ensure the table name is correct
    __table_args__ = {"extend_existing": True}
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    profile_picture = Column(String, nullable=True)  # Store the file path/URL
    
    # Relationships
    shows = relationship("Show", back_populates="creator")
    episodes = relationship("Episode", back_populates="creator")
    live_speaking = relationship("Live", secondary="live_speakers", back_populates="speakers")
    live_listening = relationship("Live", secondary="live_listeners", back_populates="listeners")
    live_speaker_requests = relationship("Live", secondary="live_speaker_requests", back_populates="speaker_requests")
    
    def __str__(self):
        return f"{self.id} {self.email} ({self.username})"