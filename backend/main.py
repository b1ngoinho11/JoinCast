# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.api import user_routes
# from app.api import auth_routes
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base  # Import Base from base.py instead of models directly

# Import all models to ensure they are registered with SQLAlchemy
from app.models.user import User  # Import each model explicitly
# from app.models.room import Room
# from app.models.podcast import Podcast
# from app.models.episode import Episode

def create_tables():
    """Create database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        raise e

def get_application():
    """Create and configure the FastAPI application"""
    _app = FastAPI(
        title="Podcast Streaming API",
        description="API for podcast streaming application with live rooms",
        version="1.0.0"
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
    _app.include_router(user_routes.router)
    # _app.include_router(room_routes.router, prefix="/api/v1/rooms", tags=["rooms"])
    # _app.include_router(podcast_routes.router, prefix="/api/v1/podcasts", tags=["podcasts"])
    # _app.include_router(websocket_routes.router, tags=["websocket"])

    @_app.on_event("startup")
    async def startup_event():
        create_tables()

    return _app

app = get_application()

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)