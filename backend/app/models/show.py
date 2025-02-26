# app/models/user.py
from sqlalchemy import Boolean, Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import BaseModel
import uuid

class Show(BaseModel):
    __tablename__ = "shows"  # Ensure the table name is correct
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    
    # Relationships
    owner = Column(String, ForeignKey("users.id"))
    
    # owner_id = Column(String, ForeignKey("users.id"))
    # rooms = relationship("Room", back_populates="owner")
    # podcasts = relationship("Podcast", back_populates="creator")
