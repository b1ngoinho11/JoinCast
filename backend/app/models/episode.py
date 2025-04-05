# app/models/episode.py
from sqlalchemy import Boolean, Column, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import Table
from app.db.base import BaseModel
import uuid

class Episode(BaseModel):
    __tablename__ = "episodes"
    __table_args__ = {"extend_existing": True}  # Allow extension of the table
    __mapper_args__ = {
        "polymorphic_identity": "episode",
        "polymorphic_on": "type",
    }

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    show_id = Column(String, ForeignKey("shows.id"), nullable=False)
    creator_id = Column(String, ForeignKey("users.id"), nullable=False)
    thumbnail = Column(String, nullable=True)
    type = Column(String, nullable=False)

    # Relationships
    show = relationship("Show", back_populates="episodes")
    creator = relationship("User", back_populates="episodes")

    def __str__(self):
        return f"{self.id} {self.name} ({self.type})"

# Define secondary tables *after* Episode to avoid premature table definition
live_speakers = Table(
    "live_speakers",
    BaseModel.metadata,
    Column("episode_id", String, ForeignKey("episodes.id"), primary_key=True),
    Column("user_id", String, ForeignKey("users.id"), primary_key=True),
    extend_existing=True,  # Add this to secondary tables too
)

live_listeners = Table(
    "live_listeners",
    BaseModel.metadata,
    Column("episode_id", String, ForeignKey("episodes.id"), primary_key=True),
    Column("user_id", String, ForeignKey("users.id"), primary_key=True),
    extend_existing=True,
)

live_speaker_requests = Table(
    "live_speaker_requests",
    BaseModel.metadata,
    Column("episode_id", String, ForeignKey("episodes.id"), primary_key=True),
    Column("user_id", String, ForeignKey("users.id"), primary_key=True),
    extend_existing=True,
)

class Recording(Episode):
    """A recorded episode that can be played back."""
    __tablename__ = None
    __mapper_args__ = {"polymorphic_identity": "recording"}

    video = Column(String, nullable=True)
    comments = Column(String, nullable=True)

    def __str__(self):
        return f"{self.id} {self.name} (Recording)"


class Live(Episode):
    """A live episode that can have active participants."""
    __tablename__ = None
    __mapper_args__ = {"polymorphic_identity": "live"}

    is_active = Column(Boolean, default=False, nullable=False)

    # Relationships
    speakers = relationship(
        "User", secondary="live_speakers", back_populates="live_speaking"
    )
    listeners = relationship(
        "User", secondary="live_listeners", back_populates="live_listening"
    )
    speaker_requests = relationship(
        "User", secondary="live_speaker_requests", back_populates="live_speaker_requests"
    )

    def __str__(self):
        return f"{self.id} {self.name} (Live)"