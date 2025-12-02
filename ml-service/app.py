from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

app = FastAPI(title="Echo ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Echo ML Service is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ml-service", "version": "1.0.0"}

@app.post("/questions/generate")
async def generate_questions(request: dict = {}):
    questions = [
        {"id": 1, "text": "What's your favorite memory together?", "category": "memories"},
        {"id": 2, "text": "What's one goal you'd like to achieve together?", "category": "goals"},
        {"id": 3, "text": "How do you feel most loved?", "category": "love"},
        {"id": 4, "text": "What's something you admire about your partner?", "category": "appreciation"},
        {"id": 5, "text": "What challenge have you overcome together?", "category": "growth"}
    ]
    
    return {
        "questions": questions,
        "generated_at": "2024-12-02T14:20:00Z",
        "personalization_level": "adaptive"
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