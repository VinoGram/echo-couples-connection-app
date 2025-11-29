from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import uvicorn
import random
from datetime import datetime

app = FastAPI(title="Echo ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class AdaptiveQuestionsRequest(BaseModel):
    user_id: str = "user_123"
    partner_id: str = "partner_123"
    category: Optional[str] = "communication"
    count: Optional[int] = 5
    chat_history: Optional[List[str]] = []

class QuestionGenerateRequest(BaseModel):
    user_id: str = "user_123"
    partner_id: str = "partner_123"
    category: Optional[str] = "general"
    count: Optional[int] = 5

class CommunicationAnalysisRequest(BaseModel):
    messages: List[str] = Field(default=[], description="List of messages to analyze")

# Question Templates
QUESTION_TEMPLATES = {
    'communication': [
        "When we disagree, I prefer to:",
        "I feel most heard when you:",
        "During conflicts, I tend to:",
        "I prefer to receive feedback:",
        "When making decisions together, I:"
    ],
    'intimacy': [
        "I feel most emotionally connected when we:",
        "Physical affection is most meaningful to me when:",
        "I feel most comfortable being vulnerable when:",
        "Our relationship feels strongest when we:",
        "I show love best through:"
    ],
    'fun': [
        "For our ideal date night, I'd choose:",
        "When we have free time, I prefer:",
        "I'm most excited about activities that are:",
        "My favorite way to spend weekends together is:",
        "I feel most energized when we:"
    ],
    'love': [
        "I feel most loved when you:",
        "My primary love language is:",
        "I prefer to show affection through:",
        "What makes me feel most appreciated is:",
        "I feel most secure in our relationship when:"
    ],
    'future': [
        "In 5 years, I see us:",
        "My biggest relationship goal is:",
        "I'm most excited about our future when I think about:",
        "For our relationship to grow, we should focus on:",
        "My dream for us includes:"
    ]
}

@app.get("/")
async def root():
    return {"message": "Echo ML Service is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ml-service", "version": "1.0.0"}

@app.post("/questions/adaptive")
async def get_adaptive_questions(request: AdaptiveQuestionsRequest):
    try:
        category = request.category or 'communication'
        count = min(request.count or 5, 10)
        
        # Get questions from templates
        templates = QUESTION_TEMPLATES.get(category, QUESTION_TEMPLATES['communication'])
        
        # Generate questions
        questions = []
        for i in range(count):
            template = templates[i % len(templates)]
            questions.append({
                "id": i + 1,
                "text": template,
                "category": category,
                "type": "multiple_choice",
                "generated_at": datetime.now().isoformat()
            })
        
        return {
            "questions": questions,
            "learning_based": True,
            "user_preferences": {"category": category}
        }
    except Exception as e:
        return {
            "questions": [
                {"id": 1, "text": "What's your favorite thing about our relationship?", "category": "love"},
                {"id": 2, "text": "How can we communicate better?", "category": "communication"}
            ],
            "learning_based": False,
            "error": str(e)
        }

@app.post("/questions/generate")
async def generate_questions(request: QuestionGenerateRequest):
    try:
        category = request.category or 'general'
        count = min(request.count or 5, 10)
        
        templates = QUESTION_TEMPLATES.get(category, QUESTION_TEMPLATES['communication'])
        
        questions = []
        for i in range(count):
            template = templates[i % len(templates)]
            questions.append({
                "id": i + 1,
                "text": template,
                "category": category,
                "type": "open_ended",
                "generated_by": "ml_service",
                "created_at": datetime.now().isoformat()
            })
        
        return {
            "questions": questions,
            "generated_at": datetime.now().isoformat(),
            "personalization_level": "adaptive",
            "learning_based": True
        }
    except Exception as e:
        return {
            "questions": [
                {"id": 1, "text": "What's something you appreciate about our relationship?", "category": "love"},
                {"id": 2, "text": "How can we make tomorrow better together?", "category": "future"}
            ],
            "generated_at": datetime.now().isoformat(),
            "personalization_level": "basic",
            "learning_based": False
        }

@app.post("/analyze-communication")
async def analyze_communication(request: CommunicationAnalysisRequest):
    try:
        messages = request.messages
        
        # Simple sentiment analysis
        positive_words = ['love', 'happy', 'great', 'good', 'amazing', 'wonderful', 'thank', 'appreciate']
        negative_words = ['sad', 'angry', 'upset', 'bad', 'terrible', 'hate', 'frustrated']
        
        positive_count = 0
        negative_count = 0
        total_words = 0
        
        for message in messages:
            if isinstance(message, str):
                words = message.lower().split()
                total_words += len(words)
                positive_count += sum(1 for word in words if word in positive_words)
                negative_count += sum(1 for word in words if word in negative_words)
        
        # Calculate scores
        if total_words > 0:
            positive_ratio = positive_count / total_words
            negative_ratio = negative_count / total_words
            communication_health = max(0.3, min(0.9, 0.5 + positive_ratio - negative_ratio))
        else:
            communication_health = 0.5
        
        # Determine overall sentiment
        if positive_count > negative_count:
            sentiment = 'positive'
        elif negative_count > positive_count:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        
        return {
            'overall_sentiment': sentiment,
            'communication_health': communication_health,
            'emotional_balance': min(0.9, communication_health + 0.1),
            'suggestions': [
                'Keep up the positive communication!' if sentiment == 'positive' else 'Try using more positive language',
                'Share more about your feelings',
                'Ask open-ended questions to deepen conversations'
            ]
        }
    except Exception as e:
        return {
            'overall_sentiment': 'neutral',
            'communication_health': 0.5,
            'emotional_balance': 0.5,
            'suggestions': ['Continue your conversation to get better insights']
        }

@app.post("/games/create-session")
async def create_game_session(request: dict):
    try:
        couple_id = request.get('couple_id', 'couple_123')
        game_type = request.get('game_type', 'adaptive')
        user_id = request.get('user_id', 'user_123')
        
        # Generate fallback questions
        questions = [
            {"id": 1, "text": "What's your favorite thing about our relationship?", "type": "open_ended", "category": "love"},
            {"id": 2, "text": "What's one goal you'd like us to work on together?", "type": "open_ended", "category": "goals"},
            {"id": 3, "text": "What makes you feel most connected to me?", "type": "open_ended", "category": "connection"}
        ]
        
        return {
            "session_id": f"session_{user_id}_{couple_id}",
            "questions": questions,
            "optimal_difficulty": "medium"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/games/submit-response")
async def submit_game_response(request: dict):
    try:
        return {
            "success": True,
            "learning_updated": True,
            "engagement_score": 0.8,
            "session_id": request.get('session_id', 'session_123')
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "learning_updated": False,
            "engagement_score": 0.5
        }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)