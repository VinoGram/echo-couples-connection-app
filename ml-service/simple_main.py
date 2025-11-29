from fastapi import FastAPI
import os
import uvicorn

app = FastAPI(title="Echo ML Service", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "Echo ML Service is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ml-service"}

@app.post("/questions/adaptive")
async def get_adaptive_questions(request: dict):
    return {
        "questions": [
            {"id": 1, "text": "What's your favorite thing about our relationship?", "category": "love"},
            {"id": 2, "text": "How can we communicate better?", "category": "communication"},
            {"id": 3, "text": "What are your dreams for our future?", "category": "future"}
        ],
        "learning_based": True
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)