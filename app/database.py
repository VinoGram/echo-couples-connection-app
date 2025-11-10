import os
from sqlalchemy import create_engine, Column, String, Float, DateTime, JSON, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

try:
    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        DATABASE_URL = 'postgresql://user:pass@localhost/echo'
        logging.warning("Using default DATABASE_URL - configure for production")
except Exception as e:
    logging.error(f"Database URL configuration error: {e}")
    DATABASE_URL = 'postgresql://user:pass@localhost/echo'

# Configure engine with SSL for Neon
Base = declarative_base()

class UserPerformance(Base):
    """Model for storing user performance data in games"""
    __tablename__ = "user_performance"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    game_type = Column(String)
    score = Column(Float)
    difficulty = Column(String)
    category = Column(String)
    engagement_score = Column(Float)
    completion_time = Column(Float)
    answers = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class CompatibilityAnalysis(Base):
    __tablename__ = "compatibility_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(String)
    user2_id = Column(String)
    compatibility_score = Column(Float)
    category_scores = Column(JSON)
    analysis_date = Column(DateTime, default=datetime.utcnow)

try:
    if DATABASE_URL:
        ssl_args = {"sslmode": "require"} if "neon.tech" in DATABASE_URL else {}
        engine = create_engine(DATABASE_URL, connect_args=ssl_args)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        DB_AVAILABLE = True
    else:
        raise ValueError("No database URL available")
except Exception as e:
    logging.warning(f"Database connection failed: {e}")
    engine = None
    SessionLocal = None
    DB_AVAILABLE = False

def get_db():
    """Get database session with error handling"""
    if not DB_AVAILABLE or not SessionLocal:
        return None
    try:
        db = SessionLocal()
        yield db
    except Exception as e:
        logging.error(f"Database session error: {e}")
        yield None
    finally:
        if 'db' in locals():
            db.close()

# Create tables only if database is available
def create_tables():
    """Create database tables if connection is available"""
    if DB_AVAILABLE and Base and engine:
        try:
            Base.metadata.create_all(bind=engine)
            logging.info("Database tables created successfully")
        except Exception as e:
            logging.warning(f"Failed to create tables: {e}")

create_tables()