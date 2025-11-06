import os
from sqlalchemy import create_engine, Column, String, Float, DateTime, JSON, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost/echo')

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UserPerformance(Base):
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

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
Base.metadata.create_all(bind=engine)