# app/models/user.py
from sqlalchemy import Boolean, Column, String, JSON
from sqlalchemy.orm import relationship
from app.db.base import BaseModel

class User(BaseModel):
    # Using email as primary key instead of UUID
    email = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    
    # OAuth specific fields
    oauth_provider = Column(String, nullable=False)  # 'google', 'github', etc.
    oauth_id = Column(String, nullable=False, unique=True)  # ID from the OAuth provider
    profile_data = Column(JSON, nullable=True)  # Store additional OAuth profile data
    
    # # Status fields
    # is_active = Column(Boolean, default=True)
    # is_superuser = Column(Boolean, default=False)
    
    # # Relationships (if you have any)
    # rooms = relationship("Room", back_populates="owner")
    # podcasts = relationship("Podcast", back_populates="creator")

    @classmethod
    def get_or_create(cls, db_session, oauth_data):
        """
        Get existing user or create new one from OAuth data
        """
        user = db_session.query(cls).filter(
            cls.email == oauth_data["email"]
        ).first()
        
        if not user:
            user = cls(
                email=oauth_data["email"],
                username=oauth_data.get("preferred_username") or oauth_data["email"].split("@")[0],
                oauth_provider=oauth_data["provider"],
                oauth_id=oauth_data["id"],
                profile_data=oauth_data.get("profile", {})
            )
            db_session.add(user)
            db_session.commit()
            db_session.refresh(user)
            
        return user