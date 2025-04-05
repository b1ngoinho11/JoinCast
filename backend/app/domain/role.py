# app/domain/role.py
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User
    from .room import Room

class Role(ABC):
    """Base role class with common behavior"""
    def __init__(self, user: 'User', room: 'Room'):
        self.user = user
        self.room = room
        
    @abstractmethod
    def can_speak(self) -> bool:
        """Whether this role allows speaking in the room"""
        pass
    
    def get_role_name(self) -> str:
        """Get string representation of role type"""
        return self.__class__.__name__.replace('Role', '').lower()

class ListenerRole(Role):
    """Role for users who can only listen"""
    def can_speak(self) -> bool:
        return False
    
    def request_to_speak(self) -> bool:
        """Request to become a speaker"""
        return self.room.request_speaker_role(self.user)

class SpeakerRole(Role):
    """Role for users who can speak in the room"""
    def can_speak(self) -> bool:
        return True
    
    def speak(self, message: str) -> None:
        """Send a message to the room"""
        self.room.broadcast(f"{self.user.username}: {message}")

class CreatorRole(SpeakerRole):
    """Role for the room creator with management capabilities"""
    def end_room(self) -> None:
        """End the current room session"""
        self.room.end()
    
    def approve_speaker(self, user: 'User') -> bool:
        """Approve a user's request to speak"""
        if user.current_role and isinstance(user.current_role, ListenerRole):
            user.current_role = SpeakerRole(user, self.room)
            return True
        return False
    
    def reject_speaker(self, user: 'User') -> bool:
        """Reject a user's request to speak"""
        # Implementation...
        return True

# app/domain/user.py
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .role import Role
    from .room import Room

class User:
    """User domain entity"""
    def __init__(self, user_id: str, username: str, email: str):
        self.user_id = user_id
        self.username = username
        self.email = email
        self.current_role: Optional['Role'] = None
        self.current_room_id: Optional[str] = None
    
    def join_room(self, room: 'Room') -> None:
        """Join a room and get assigned appropriate role"""
        from .role import ListenerRole, CreatorRole
        
        if room.creator_id == self.user_id:
            self.current_role = CreatorRole(self, room)
        else:
            self.current_role = ListenerRole(self, room)
        
        self.current_room_id = room.room_id
        room.add_participant(self)
    
    def leave_room(self) -> None:
        """Leave current room and reset role"""
        if self.current_role and self.current_room_id:
            self.current_role.room.remove_participant(self)
            self.current_role = None
            self.current_room_id = None
    
    def get_role_name(self) -> Optional[str]:
        """Get current role name if any"""
        if self.current_role:
            return self.current_role.get_role_name()
        return None

# app/models/room.py
from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime, Table
from sqlalchemy.orm import relationship
import datetime

from app.db.base import Base

# Junction table for room participants with role tracking
room_participants = Table(
    'room_participants', 
    Base.metadata,
    Column('user_id', String, ForeignKey('users.user_id')),
    Column('room_id', String, ForeignKey('rooms.room_id')),
    Column('role_type', String),  # 'listener', 'speaker', 'creator'
    Column('joined_at', DateTime, default=datetime.datetime.utcnow)
)

class RoomModel(Base):
    __tablename__ = 'rooms'
    
    room_id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    creator_id = Column(String, ForeignKey('users.user_id'))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    podcast_id = Column(String, ForeignKey('podcasts.podcast_id'), nullable=True)
    
    # Relationships
    creator = relationship("UserModel", back_populates="created_rooms")
    participants = relationship("UserModel", secondary=room_participants, back_populates="participated_rooms")
    speaker_requests = relationship("SpeakerRequestModel", back_populates="room")

# app/repositories/room_repository.py
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import update, and_

from app.models.room import RoomModel, room_participants
from app.models.user import UserModel
from app.domain.room import Room
from app.domain.user import User
from app.domain.role import ListenerRole, SpeakerRole, CreatorRole

class RoomRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_active_by_id(self, room_id: str) -> Optional[Room]:
        """Get active room with domain mapping"""
        room_model = self.db.query(RoomModel).filter(
            RoomModel.room_id == room_id,
            RoomModel.is_active == True
        ).first()
        
        if not room_model:
            return None
        
        # Create domain Room
        room = Room(
            room_id=room_model.room_id,
            title=room_model.title,
            creator_id=room_model.creator_id
        )
        
        return room
    
    def get_with_participants(self, room_id: str) -> Optional[Room]:
        """Get room with all participants and their roles"""
        room = self.get_active_by_id(room_id)
        if not room:
            return None
        
        # Get all participants with their roles
        participants_query = self.db.query(
            UserModel, room_participants.c.role_type
        ).join(
            room_participants, 
            and_(
                UserModel.user_id == room_participants.c.user_id,
                room_participants.c.room_id == room_id
            )
        )
        
        for user_model, role_type in participants_query:
            user = User(
                user_id=user_model.user_id,
                username=user_model.username,
                email=user_model.email
            )
            
            # Assign appropriate role based on stored type
            if role_type == 'creator':
                user.current_role = CreatorRole(user, room)
            elif role_type == 'speaker':
                user.current_role = SpeakerRole(user, room)
            else:
                user.current_role = ListenerRole(user, room)
            
            user.current_room_id = room_id
            room.participants[user.user_id] = user
            
        return room