# check_db.py
import os
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = str(Path(__file__).parents[1])
sys.path.append(project_root)

from sqlalchemy import inspect, text
from app.db.session import engine, SessionLocal
from app.models.user import User

def test_db_connection():
    """Test if the database connection works"""
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        assert result.scalar() == 1, "Database connection failed"

def test_list_tables():
    """Ensure tables are present in the database"""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert len(tables) > 0, "No tables found in the database"

def test_user_table():
    """Check user table for existence and user count"""
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        assert isinstance(user_count, int), "User count should be an integer"
    finally:
        db.close()

def check_db_connection():
    """Test basic database connection"""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def list_tables():
    """List all tables in the database"""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if not tables:
        print("No tables found in database.")
        return
    
    print("\n--- Database Tables ---")
    for table in tables:
        print(f"- {table}")

def check_user_table():
    """Check if user table exists and show count"""
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        print(f"\n--- User Table ---")
        print(f"Total users: {user_count}")
        
        if user_count > 0:
            print("\nFirst 5 users:")
            users = db.query(User).limit(5).all()
            for idx, user in enumerate(users, 1):
                print(f"\n[User {idx}]")
                print(f"ID: {user.id}")
                print(f"Username: {user.username}")
                print(f"Email: {user.email}")
                print(f"Created: {user.created_at}")
    except Exception as e:
        print(f"❌ Error querying user table: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("=== Database Check Utility ===")
    
    if check_db_connection():
        list_tables()
        check_user_table()
        