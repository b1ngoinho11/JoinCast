# app/models/episode.py
from sqlalchemy import Boolean, Column, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import Table
from app.db.base import BaseModel
import uuid
from openai import OpenAI
from app.core.config import settings
import json

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
    categories = Column(String, nullable=True)  # Add categories column
    
    video = Column(String, nullable=True)  # This will store the filename of the uploaded video
    transcript = Column(String, nullable=True)  # Add transcript column
    
    # Relationships
    show = relationship("Show", back_populates="episodes")
    creator = relationship("User", back_populates="episodes")

    def __str__(self):
        return f"{self.id} {self.name} ({self.type})"
    
    def generate_transcript(self):
        """
        Generate transcript from video file.
        Only applicable for Recording episodes with a video file.
        Returns the transcript text or None if not possible.
        """
        if not hasattr(self, 'video') or not self.video:
            return None
            
        # Import here to avoid circular imports
        import os
        from app.core.config import settings
        from app.utils.transcript import transcribe_media
        
        # Construct full path to the video file
        video_path = os.path.join(settings.UPLOAD_RECORDING_DIR, self.video)
        
        # Check if file exists
        if not os.path.exists(video_path):
            return None
            
        try:
            # Generate the transcript
            transcript_text = transcribe_media(video_path)
            
            # Save the transcript to the database
            self.transcript = transcript_text
            
            return transcript_text
        except Exception as e:
            print(f"Transcript generation error: {str(e)}")
            return None
        
    def generate_summary(self):
        """
        Generate a summary of the episode using DeepSeek AI.
        Returns a structured summary with timestamps of main topics.
        """
        
        if not self.transcript:
            return "No transcript available"
        
        summary = None
            
        try:
            # Initialize OpenAI client with OpenRouter base URL
            client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=settings.OPENROUTER_API_KEY,
            )
            
            # Call DeepSeek AI for summarization
            completion = client.chat.completions.create(
                extra_body={},
                model="deepseek/deepseek-chat-v3-0324:free",
                messages=[
                    {
                        "role": "user",
                        "content": f"""
                        Create two outputs for this video transcript:

                        1. A structured summary with the following format:
                        
                        # [Main Title]
                        
                        **Main Topic (Timestamp: XX:XX:XX - XX:XX:XX)** – [Brief overview]. 
                        – [Key point 1]
                        – [Key point 2]
                        
                        **Key Details**
                        – [Important detail 1]
                        – [Important detail 2]

                        2. A timestamp navigation table in this format:
                        [TIMESTAMP_NAVIGATION]
                        - [XX:XX:XX] Topic description
                        - [XX:XX:XX] Another topic
                        - [XX:XX:XX] Key point
                        [/TIMESTAMP_NAVIGATION]
                        
                        Formatting rules:
                        1. Use # only for the main title
                        2. Use **double asterisks** for section headers only
                        3. Use – for bullet points (not -)
                        4. Bold important terms within sentences with **double asterisks**
                        5. Keep each bullet point on one line
                        6. Don't use markdown symbols except as specified above
                        7. Don't include any "let me know" or similar AI helper text
                        
                        Transcript:
                        {self.transcript}
                        """
                    }
                ]
            )
            
            # Get the summary from the response
            summary = completion.choices[0].message.content
            
            # Cache the summary in a database or file system if needed
            # This is optional but recommended to avoid redundant API calls
        except Exception as e:
            return f"Summary generation error: {str(e)}"
            
        return summary
        

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