# app/db/base.py
from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declared_attr
from app.db.session import Base

class BaseModel(Base):
    """Base class for all models"""
    __abstract__ = True
    
    # Automatically use class name in lowercase for table name
    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()
    
    # Common columns for all models
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())