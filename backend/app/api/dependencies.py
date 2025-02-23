# app/api/dependencies.py
from typing import Generator
from app.db.session import SessionLocal

def get_db() -> Generator:
    """
    Dependency for getting database session.
    Usage:
        @app.get("/users/")
        def get_users(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()