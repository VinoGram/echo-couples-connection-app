from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from app.models import *
from app.compatibility import CompatibilityAnalyzer
from app.recommendation import RecommendationEngine
from app.sentiment import SentimentAnalyzer
from app.question_recommender import QuestionRecommender
from app.adaptive_learning import AdaptiveLearningEngine
from app.game_results import GameResultsManager
from app.question_generator import QuestionGenerator
from app.database import get_db, UserPerformance

load_dotenv()

app = FastAPI(title="Echo ML Service", version="1.0.0")

# Initialize ML components
compatibility_analyzer = CompatibilityAnalyzer()
recommendation_engine = RecommendationEngine()
sentiment_analyzer = SentimentAnalyzer()
question_recommender = QuestionRecommender()
adaptive_engine = AdaptiveLearningEngine()
game_results_manager = GameResultsManager()
question_generator = QuestionGenerator()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Echo ML Service is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ml-service"}

@app.post("/analyze-compatibility", response_model=CompatibilityResponse)
async def analyze_compatibility(request: CompatibilityRequest):
    try:
        result = compatibility_analyzer.analyze(request.user1_answers, request.user2_answers)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    try:
        result = sentiment_analyzer.analyze(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend-questions", response_model=QuestionRecommendationResponse)
async def recommend_questions(request: QuestionRecommendationRequest):
    try:
        result = question_recommender.recommend(request.user_id, request.answered_questions)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/relationship-insights", response_model=RelationshipInsightResponse)
async def get_relationship_insights(request: RelationshipInsightRequest):
    try:
        result = compatibility_analyzer.generate_insights(request.interaction_history)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/daily-tip")
async def get_daily_tip(category: str = None):
    try:
        tip = recommendation_engine.get_daily_tip(category)
        return {"tip": tip, "category": category}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/daily-question")
async def get_daily_question(difficulty: str = None, category: str = None):
    try:
        preferences = {}
        if difficulty:
            preferences['difficulty'] = difficulty
        if category:
            preferences['category'] = category
        
        question = question_recommender.get_daily_question(preferences)
        return question
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend-games")
async def recommend_games(user_preferences: dict, interaction_history: list = []):
    try:
        games = recommendation_engine.recommend_games(user_preferences, interaction_history)
        return {"recommended_games": games}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/adjust-difficulty")
async def adjust_difficulty(user_performance: dict, current_difficulty: str):
    try:
        new_difficulty = recommendation_engine.adaptive_difficulty_adjustment(
            user_performance, current_difficulty
        )
        return {"recommended_difficulty": new_difficulty}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-communication")
async def analyze_communication(messages: list):
    try:
        analysis = sentiment_analyzer.analyze_relationship_communication(messages)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/games/create-session")
async def create_game_session(couple_id: str, game_type: str, user_id: str):
    try:
        # Get adaptive questions
        partner_id = "partner_" + user_id  # Simplified for demo
        available_questions = question_recommender.question_bank.get(game_type, [])
        
        if not available_questions:
            # Fallback to general questions
            all_questions = [q for questions in question_recommender.question_bank.values() for q in questions]
            available_questions = all_questions
        
        # Select optimal questions using ML
        selected_questions = adaptive_engine.select_questions(user_id, partner_id, available_questions, count=5)
        
        # Create game session
        session_id = game_results_manager.create_game_session(couple_id, game_type, selected_questions)
        
        return {
            "session_id": session_id,
            "questions": selected_questions,
            "optimal_difficulty": adaptive_engine.get_optimal_difficulty(user_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/games/submit-response")
async def submit_game_response(session_id: str, user_id: str, question_id: str, response: dict):
    try:
        success = game_results_manager.submit_response(session_id, user_id, question_id, response)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/games/complete-session")
async def complete_game_session(session_id: str, user_id: str, game_data: dict):
    try:
        # Complete the game session
        results = game_results_manager.complete_game_session(session_id)
        
        # Update adaptive learning
        partner_id = game_data.get('partner_id', 'unknown')
        adaptive_engine.record_game_session(user_id, partner_id, game_data)
        
        # Generate learning insights
        insights = adaptive_engine.get_learning_insights(user_id)
        
        return {
            "results": results,
            "insights": insights,
            "can_replay": game_results_manager.can_replay_game(game_data.get('couple_id'), game_data.get('game_type'))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/games/results/{session_id}")
async def get_game_results(session_id: str):
    try:
        results = game_results_manager.get_session_results(session_id)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/couples/{couple_id}/history")
async def get_couple_history(couple_id: str):
    try:
        history = game_results_manager.get_couple_history(couple_id)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}/insights")
async def get_user_insights(user_id: str):
    try:
        insights = adaptive_engine.get_learning_insights(user_id)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/questions/adaptive")
async def get_adaptive_questions(user_id: str, partner_id: str, category: str = None, count: int = 5):
    try:
        # Get user profiles for question generation
        user_profile = adaptive_engine.user_profiles.get(user_id, {})
        partner_profile = adaptive_engine.user_profiles.get(partner_id, {})
        
        # Generate new questions based on profiles
        generated_questions = question_generator.generate_questions(user_profile, partner_profile, count)
        
        return {
            "questions": generated_questions,
            "optimal_difficulty": adaptive_engine.get_optimal_difficulty(user_id),
            "generation_info": {
                "user_games_played": user_profile.get('games_played', 0),
                "preferred_categories": list(user_profile.get('preferred_categories', {}).keys())[:3]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/questions/generate")
async def generate_new_questions(user_id: str, partner_id: str, count: int = 5, category: str = None):
    try:
        user_profile = adaptive_engine.user_profiles.get(user_id, {})
        partner_profile = adaptive_engine.user_profiles.get(partner_id, {})
        
        # Generate completely new questions
        new_questions = question_generator.generate_questions(user_profile, partner_profile, count)
        
        return {
            "questions": new_questions,
            "generated_at": "2024-01-01T00:00:00",
            "personalization_level": "high" if user_profile.get('games_played', 0) > 5 else "medium" if user_profile.get('games_played', 0) > 0 else "basic"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/questions/follow-up")
async def generate_follow_up_questions(previous_answers: list, count: int = 3):
    try:
        follow_ups = question_generator.generate_follow_up_questions(previous_answers, count)
        
        return {
            "questions": follow_ups,
            "type": "follow_up",
            "based_on_answers": len(previous_answers)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/questions/contextual")
async def generate_contextual_questions(conversation_context: list, communication_analysis: dict, user_id: str, partner_id: str):
    try:
        # Analyze conversation topics and sentiment
        topics = extract_conversation_topics(conversation_context)
        sentiment_trend = communication_analysis.get('overall_sentiment', 'neutral')
        
        # Generate questions based on conversation context
        contextual_questions = question_generator.generate_contextual_questions(
            topics, sentiment_trend, user_id, partner_id
        )
        
        # Generate conversation improvement suggestions
        suggestions = generate_conversation_suggestions(communication_analysis, topics)
        
        return {
            "questions": contextual_questions,
            "suggestions": suggestions,
            "context_analysis": {
                "topics": topics,
                "sentiment": sentiment_trend
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/conversation/update-context")
async def update_conversation_context(user_id: str, partner_id: str, messages: list, analysis: dict, timestamp: str):
    try:
        # Update user profiles with conversation data
        couple_key = f"{min(user_id, partner_id)}_{max(user_id, partner_id)}"
        
        conversation_data = {
            'messages': messages[-5:],  # Keep last 5 messages
            'analysis': analysis,
            'timestamp': timestamp,
            'topics': extract_conversation_topics(messages)
        }
        
        # Store in adaptive learning engine
        adaptive_engine.update_conversation_context(couple_key, conversation_data)
        
        return {"success": True, "context_updated": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def extract_conversation_topics(messages: list) -> list:
    """Extract key topics from conversation"""
    topics = []
    keywords = {
        'work': ['work', 'job', 'career', 'office', 'boss'],
        'family': ['family', 'parents', 'kids', 'children', 'relatives'],
        'future': ['future', 'plans', 'goals', 'dreams', 'tomorrow'],
        'feelings': ['feel', 'love', 'happy', 'sad', 'angry', 'excited'],
        'activities': ['do', 'go', 'play', 'watch', 'eat', 'travel']
    }
    
    for message in messages:
        message_lower = message.lower()
        for topic, words in keywords.items():
            if any(word in message_lower for word in words):
                if topic not in topics:
                    topics.append(topic)
    
    return topics[:3]  # Return top 3 topics

def generate_conversation_suggestions(analysis: dict, topics: list) -> list:
    """Generate suggestions to improve conversation"""
    suggestions = []
    
    communication_health = analysis.get('communication_health', 0.5)
    
    if communication_health < 0.5:
        suggestions.append("Try asking more open-ended questions to deepen your conversation")
        suggestions.append("Share more about your feelings and thoughts")
    elif communication_health < 0.7:
        suggestions.append("Consider exploring the topics you've been discussing more deeply")
    
    if 'feelings' not in topics:
        suggestions.append("Try sharing how you're feeling about the topics you're discussing")
    
    if len(topics) < 2:
        suggestions.append("Explore new conversation topics to learn more about each other")
    
    return suggestions[:3]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)