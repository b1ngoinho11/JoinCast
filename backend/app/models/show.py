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
    
    def add_episode_to_show(self, episode):
        self.episodes.append(episode)
        episode.show = self
        return episode
    
    def get_episodes(self):
        return self.episodes
    
    def get_creator(self):
        return self.creator
    
    def get_show_details(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "creator_id": self.creator_id
        }
        
    def get_show_episodes(self):
        return [episode.get_episode_details() for episode in self.episodes]
    
    