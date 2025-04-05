from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.api import user_routes, show_routes, episode_routes, auth_routes, episode_live_routes, episode_recording_routes
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base  # Import Base from base.py instead of models directly

# Import all models to ensure they are registered with SQLAlchemy
# from app.models.user import User  # Import each model explicitly
# from app.models.show import Show
# from app.models.episode import Episode, Recording, Live  # Include all episode classes
from app.models import *  # This imports everything from __init__.py once

def create_tables():
    """Create database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        raise e

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler for FastAPI application
    Replaces the deprecated on_event("startup") approach
    """
    # Startup code: create database tables
    create_tables()
    
    yield
    
    # Shutdown code (if any)
    # This executes when the application is shutting down
    pass

def get_application():
    """Create and configure the FastAPI application"""
    _app = FastAPI(
        title="Podcast Streaming API",
        description="API for podcast streaming application with live rooms",
        version="1.0.0",
        lifespan=lifespan  # Use the lifespan context manager
    )

    # Configure CORS
    _app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure this appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add home page
    @_app.get("/")
    async def home():
        return JSONResponse(content={"message": "Welcome to Podcast Streaming API"})

    # Include routers
    _app.include_router(auth_routes.router)
    _app.include_router(user_routes.router)
    _app.include_router(show_routes.router)
    _app.include_router(episode_routes.router)
    _app.include_router(episode_live_routes.router)
    _app.include_router(episode_recording_routes.router)
    # _app.include_router(room_routes.router, prefix="/api/v1/rooms", tags=["rooms"])
    # _app.include_router(podcast_routes.router, prefix="/api/v1/podcasts", tags=["podcasts"])
    # _app.include_router(websocket_routes.router, tags=["websocket"])

    return _app

app = get_application()
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)