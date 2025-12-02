from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
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

class AdaptiveQuestionsRequest(BaseModel):
    user_id: str
    partner_id: str
    category: Optional[str] = "communication"
    count: Optional[int] = 5

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
        
        templates = QUESTION_TEMPLATES.get(category, QUESTION_TEMPLATES['communication'])
        
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
async def generate_questions(request: dict = {}):
    try:
        category = request.get('category', 'general')
        count = min(request.get('count', 5), 10)
        
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
            "personalization_level": "adaptive"
        }
    except Exception as e:
        return {
            "questions": [
                {"id": 1, "text": "What's something you appreciate about our relationship?", "category": "love"},
                {"id": 2, "text": "How can we make tomorrow better together?", "category": "future"}
            ],
            "generated_at": datetime.now().isoformat(),
            "personalization_level": "basic"
        }

@app.get("/games/this-or-that")
async def this_or_that_questions():
    questions = [
        {"option1": "Coffee", "option2": "Tea"},
        {"option1": "Beach vacation", "option2": "Mountain vacation"},
        {"option1": "Movie night", "option2": "Night out"},
        {"option1": "Early bird", "option2": "Night owl"},
        {"option1": "Cooking together", "option2": "Ordering takeout"}
    ]
    return {"questions": questions}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)