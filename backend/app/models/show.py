# app/models/show.py
from sqlalchemy import Boolean, Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import BaseModel
import uuid

class Show(BaseModel):
    __tablename__ = "shows"
    __table_args__ = {"extend_existing": True}
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    creator_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    creator = relationship("User", back_populates="shows")
    episodes = relationship("Episode", back_populates="show")
    
    def __str__(self):
        return f"{self.id} {self.name}"