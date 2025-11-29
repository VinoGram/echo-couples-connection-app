from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Echo ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AdaptiveQuestionsRequest(BaseModel):
    user_id: str = "user_123"
    partner_id: str = "partner_123"
    category: Optional[str] = "communication"
    count: Optional[int] = 5

@app.get("/")
async def root():
    return {"message": "Echo ML Service is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ml-service"}

@app.post("/questions/adaptive")
async def get_adaptive_questions(request: AdaptiveQuestionsRequest):
    questions = [
        {"id": 1, "text": "What's your favorite way to spend time together?", "category": "activities", "type": "multiple_choice"},
        {"id": 2, "text": "How do you prefer to communicate during disagreements?", "category": "communication", "type": "multiple_choice"},
        {"id": 3, "text": "What makes you feel most loved in our relationship?", "category": "love", "type": "multiple_choice"},
        {"id": 4, "text": "What are your biggest dreams for our future together?", "category": "future", "type": "multiple_choice"},
        {"id": 5, "text": "How can we better support each other's goals?", "category": "support", "type": "multiple_choice"}
    ]
    
    return {
        "questions": questions[:request.count],
        "learning_based": True,
        "user_preferences": {}
    }

@app.post("/questions/generate")
async def generate_questions(request: dict):
    questions = [
        {"id": 1, "text": "What's something you appreciate about our relationship?", "category": "love"},
        {"id": 2, "text": "How can we make our communication even better?", "category": "communication"},
        {"id": 3, "text": "What's one goal we should work on together?", "category": "future"}
    ]
    
    return {
        "questions": questions,
        "generated_at": "2024-01-01T00:00:00Z",
        "personalization_level": "basic",
        "learning_based": False
    }

@app.post("/analyze-communication")
async def analyze_communication(request: dict):
    return {
        'overall_sentiment': 'positive',
        'communication_health': 0.8,
        'emotional_balance': 0.7,
        'suggestions': ['Keep up the great communication!', 'Try sharing more feelings']
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)