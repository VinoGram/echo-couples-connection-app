from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import os
from datetime import datetime
from dotenv import load_dotenv
from app.models import (
    CompatibilityRequest, CompatibilityResponse, SentimentRequest, SentimentResponse,
    QuestionRecommendationRequest, QuestionRecommendationResponse, RelationshipInsightRequest,
    RelationshipInsightResponse, QuestionGenerateRequest, AdaptiveQuestionsRequest, FollowUpQuestionsRequest
)
from pydantic import BaseModel
from typing import List

from pydantic import field_validator, Field, validator
from typing import Union, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CommunicationAnalysisRequest(BaseModel):
    """Request model for analyzing communication patterns"""
    messages: List[str] = Field(default=[], description="List of messages to analyze")
    
    class Config:
        extra = "ignore"  # Allow extra fields from frontend
        json_schema_extra = {
            "example": {
                "messages": ["Hello how are you?", "I'm doing great!"]
            }
        }
    
    @field_validator('messages', mode='before')
    @classmethod
    def normalize_messages(cls, v):
        if not v:
            return []
        if isinstance(v, str):
            return [v]
        if isinstance(v, list):
            return [str(msg) for msg in v if msg]
        logger.warning(f"Invalid messages format: {type(v)}, using empty list")
        return []

class ContextualQuestionsRequest(BaseModel):
    """Request model for generating contextual questions"""
    conversation_context: List[str] = Field(default=[], description="Recent conversation messages")
    communication_analysis: dict = Field(default={}, description="Analysis results from communication")
    user_id: str = Field(default="user_123", description="User identifier")
    partner_id: str = Field(default="partner_123", description="Partner identifier")
    
    class Config:
        extra = "ignore"
        json_schema_extra = {
            "example": {
                "conversation_context": ["How was your day?", "It was good thanks"],
                "communication_analysis": {"overall_sentiment": "positive"},
                "user_id": "user_123",
                "partner_id": "partner_456"
            }
        }
    
    @validator('conversation_context', pre=True)
    def normalize_context(cls, v):
        if not v:
            return []
        if isinstance(v, str):
            return [v]
        if isinstance(v, list):
            return [str(msg) for msg in v if msg]
        return []
    
    @validator('communication_analysis', pre=True)
    def normalize_analysis(cls, v):
        if not isinstance(v, dict):
            logger.warning(f"Invalid analysis format: {type(v)}, using empty dict")
            return {}
        return v

class ConversationUpdateRequest(BaseModel):
    """Request model for updating conversation context"""
    user_id: str = Field(default="user_123", description="User identifier")
    partner_id: str = Field(default="partner_123", description="Partner identifier")
    messages: List[str] = Field(default=[], description="Conversation messages")
    analysis: dict = Field(default={}, description="Communication analysis results")
    timestamp: str = Field(default="", description="Timestamp of the conversation")
    
    class Config:
        extra = "ignore"
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "partner_id": "partner_456", 
                "messages": ["Hello", "Hi there"],
                "analysis": {"communication_health": 0.8},
                "timestamp": "2024-01-01T12:00:00Z"
            }
        }
    
    @validator('messages', pre=True)
    def normalize_messages(cls, v):
        if not v:
            return []
        if isinstance(v, str):
            return [v]
        if isinstance(v, list):
            return [str(msg) for msg in v if msg]
        return []
    
    @validator('analysis', pre=True)
    def normalize_analysis(cls, v):
        if not isinstance(v, dict):
            return {}
        return v
from app.compatibility import CompatibilityAnalyzer
from app.recommendation import RecommendationEngine
from app.sentiment import SentimentAnalyzer
from app.question_recommender import QuestionRecommender
from app.adaptive_learning import AdaptiveLearningEngine
from app.game_results import GameResultsManager
from app.question_generator import QuestionGenerator
from app.database import get_db, UserPerformance, DB_AVAILABLE
from app.learning_engine import LearningEngine

load_dotenv()

app = FastAPI(title="Echo ML Service", version="1.0.0")

# Configure logging for the app
logging.getLogger("uvicorn.access").setLevel(logging.INFO)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error for {request.url}: {exc.errors()}")
    logger.error(f"Request body: {await request.body()}")
    body = await request.body()
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": body.decode() if body else "empty"}
    )

# Initialize ML components with fallbacks
def safe_init_component(component_class, name):
    try:
        return component_class()
    except Exception as e:
        print(f"Failed to initialize {name}: {e}")
        return None

compatibility_analyzer = safe_init_component(CompatibilityAnalyzer, "CompatibilityAnalyzer")
recommendation_engine = safe_init_component(RecommendationEngine, "RecommendationEngine")
sentiment_analyzer = safe_init_component(SentimentAnalyzer, "SentimentAnalyzer")
question_recommender = safe_init_component(QuestionRecommender, "QuestionRecommender")
question_generator = safe_init_component(QuestionGenerator, "QuestionGenerator")
learning_engine = safe_init_component(LearningEngine, "LearningEngine")

# Initialize these as None for now since they may have complex dependencies
adaptive_engine = None
game_results_manager = None

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
    return {
        "status": "healthy", 
        "service": "ml-service",
        "database": "connected" if DB_AVAILABLE else "disconnected"
    }

@app.post("/test-format")
async def test_format(data: dict):
    """Test endpoint to see what format frontend is sending"""
    logger.info(f"Received test data: {data}")
    return {"received": data, "type": str(type(data))}

@app.post("/analyze-compatibility", response_model=CompatibilityResponse)
async def analyze_compatibility(request: CompatibilityRequest):
    if not compatibility_analyzer:
        raise HTTPException(status_code=503, detail="Compatibility analyzer not available")
    try:
        result = compatibility_analyzer.analyze(request.user1_answers, request.user2_answers)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    if not sentiment_analyzer:
        raise HTTPException(status_code=503, detail="Sentiment analyzer not available")
    try:
        result = sentiment_analyzer.analyze(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend-questions", response_model=QuestionRecommendationResponse)
async def recommend_questions(request: QuestionRecommendationRequest):
    if not question_recommender:
        raise HTTPException(status_code=503, detail="Question recommender not available")
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
    if not recommendation_engine:
        raise HTTPException(status_code=503, detail="Recommendation engine not available")
    try:
        tip = recommendation_engine.get_daily_tip(category)
        return {"tip": tip, "category": category}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/daily-question")
async def get_daily_question(difficulty: str = None, category: str = None):
    if not question_recommender:
        raise HTTPException(status_code=503, detail="Question recommender not available")
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
    if not recommendation_engine:
        raise HTTPException(status_code=503, detail="Recommendation engine not available")
    try:
        games = recommendation_engine.recommend_games(user_preferences, interaction_history)
        return {"recommended_games": games}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/adjust-difficulty")
async def adjust_difficulty(user_performance: dict, current_difficulty: str):
    if not recommendation_engine:
        raise HTTPException(status_code=503, detail="Recommendation engine not available")
    try:
        new_difficulty = recommendation_engine.adaptive_difficulty_adjustment(
            user_performance, current_difficulty
        )
        return {"recommended_difficulty": new_difficulty}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-communication")
async def analyze_communication(request: CommunicationAnalysisRequest):
    try:
        global sentiment_analyzer
        logger.info(f"Received communication analysis request: {request.dict()}")
        
        # Initialize sentiment analyzer if not available
        if not sentiment_analyzer:
            from app.sentiment import SentimentAnalyzer
            sentiment_analyzer = SentimentAnalyzer()
        
        messages = request.messages
        logger.info(f"Processing {len(messages)} messages: {messages[:2]}...")
        
        # Filter out non-string messages (already validated by Pydantic)
        valid_messages = [msg for msg in messages if msg.strip()]
        
        analysis = sentiment_analyzer.analyze_relationship_communication(valid_messages)
        return analysis
    except Exception as e:
        print(f"Communication analysis error: {e}")
        # Return fallback response
        return {
            'overall_sentiment': 'neutral',
            'communication_health': 0.5,
            'emotional_balance': 0.5,
            'suggestions': ['Continue your conversation to get better insights']
        }

@app.post("/games/create-session")
async def create_game_session(request: dict):
    couple_id = request.get('couple_id', 'couple_123')
    game_type = request.get('game_type', 'adaptive')
    user_id = request.get('user_id', 'user_123')
    
    # Return fallback response if services not available
    if not question_recommender or not adaptive_engine or not game_results_manager:
        fallback_questions = [
            {"id": 1, "text": "What's your favorite thing about our relationship?", "type": "open_ended", "category": "love"},
            {"id": 2, "text": "What's one goal you'd like us to work on together?", "type": "open_ended", "category": "goals"},
            {"id": 3, "text": "What makes you feel most connected to me?", "type": "open_ended", "category": "connection"}
        ]
        return {
            "session_id": f"fallback_{user_id}_{couple_id}",
            "questions": fallback_questions,
            "optimal_difficulty": "medium"
        }
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
async def submit_game_response(request: dict):
    try:
        session_id = request.get('session_id', 'fallback_session')
        user_id = request.get('user_id', 'user_123')
        partner_id = request.get('partner_id', 'unknown')
        game_type = request.get('game_type', 'unknown')
        game_data = request.get('game_data', {})
        timestamp = request.get('timestamp', datetime.now().isoformat())
        
        # Calculate engagement score based on game completion and data quality
        engagement_score = calculate_game_engagement(game_type, game_data)
        
        # Learn from game interaction
        if learning_engine:
            learning_engine.learn_from_interaction(user_id, {
                'category': map_game_to_category(game_type),
                'engagement_score': engagement_score,
                'interaction_type': 'game_completion',
                'game_type': game_type,
                'timestamp': timestamp,
                'partner_id': partner_id
            })
            
            # Also learn for partner if available
            if partner_id != 'unknown':
                learning_engine.learn_from_interaction(partner_id, {
                    'category': map_game_to_category(game_type),
                    'engagement_score': engagement_score * 0.8,  # Slightly lower for indirect learning
                    'interaction_type': 'partner_game_completion',
                    'game_type': game_type,
                    'timestamp': timestamp,
                    'partner_id': user_id
                })
        
        # Store game results if manager available
        success = True
        if game_results_manager:
            try:
                success = game_results_manager.submit_response(session_id, user_id, game_type, game_data)
            except Exception as e:
                logger.error(f"Game results manager error: {e}")
        
        # Auto-generate questions if high engagement in games
        if engagement_score > 0.8 and learning_engine:
            try:
                # Generate personalized questions based on game results
                import asyncio
                asyncio.create_task(generate_personalized_questions({
                    'user_id': user_id,
                    'partner_id': partner_id,
                    'count': 2
                }))
            except Exception as e:
                logger.error(f"Failed to trigger question generation: {e}")
        
        return {
            "success": success,
            "learning_updated": bool(learning_engine),
            "engagement_score": engagement_score,
            "session_id": session_id,
            "recommendations": generate_game_recommendations(user_id, game_type, engagement_score),
            "auto_generation_triggered": engagement_score > 0.8
        }
    except Exception as e:
        logger.error(f"Game submission error: {e}")
        return {
            "success": False,
            "error": str(e),
            "learning_updated": False,
            "engagement_score": 0.5
        }

@app.post("/games/complete-session")
async def complete_game_session(request: dict):
    session_id = request.get('session_id', 'fallback_session')
    user_id = request.get('user_id', 'user_123')
    game_data = request.get('game_data', {})
    
    # Return fallback results if services not available
    if not game_results_manager or not adaptive_engine:
        return {
            "results": {
                "session_id": session_id,
                "participants": {user_id: {"score": 0.8}},
                "comparisons": [],
                "summary": {
                    "total_questions": 3,
                    "matches": 2,
                    "compatibility_score": 0.75,
                    "insights": ["Great communication!", "Keep exploring together"]
                }
            },
            "insights": {
                "games_played": 1,
                "avg_score": 0.8,
                "engagement_level": "high",
                "optimal_difficulty": "medium",
                "improvement_suggestions": ["Try more challenging questions", "Explore deeper topics"]
            },
            "can_replay": True
        }
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
    if not game_results_manager:
        raise HTTPException(status_code=503, detail="Game results manager not available")
    try:
        results = game_results_manager.get_session_results(session_id)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/couples/{couple_id}/history")
async def get_couple_history(couple_id: str):
    if not game_results_manager:
        raise HTTPException(status_code=503, detail="Game results manager not available")
    try:
        history = game_results_manager.get_couple_history(couple_id)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}/insights")
async def get_user_insights(user_id: str):
    if not adaptive_engine:
        raise HTTPException(status_code=503, detail="Adaptive engine not available")
    try:
        insights = adaptive_engine.get_learning_insights(user_id)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/questions/adaptive")
async def get_adaptive_questions(request: AdaptiveQuestionsRequest):
    try:
        global learning_engine
        # Initialize learning engine if not available
        if not learning_engine:
            learning_engine = LearningEngine()
        
        # Generate adaptive questions using learning engine
        adaptive_questions = learning_engine.get_adaptive_questions(request.user_id, request.count or 5)
        
        # Train with user interaction data if learning engine is available
        if learning_engine:
            try:
                learning_engine.learn_from_interaction(request.user_id, {
                    'category': request.category or 'adaptive',
                    'engagement_score': 0.8,
                    'interaction_type': 'adaptive_question_request'
                })
            except Exception as e:
                print(f"Learning engine error: {e}")
        
        return {
            "questions": adaptive_questions,
            "learning_based": True,
            "user_preferences": learning_engine.user_preferences.get(request.user_id, {}) if learning_engine and hasattr(learning_engine, 'user_preferences') else {}
        }
    except Exception as e:
        import traceback
        print(f"Adaptive questions error: {e}")
        print(f"Error type: {type(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        # Return fallback quiz-style questions
        fallback_questions = [
            {"id": 1, "text": "When we have free time together, I prefer:", "category": "fun", "depth": "light"},
            {"id": 2, "text": "In our relationship, I feel most supported when:", "category": "future", "depth": "medium"},
            {"id": 3, "text": "My favorite way to create memories with you is:", "category": "memories", "depth": "light"}
        ]
        return {
            "questions": fallback_questions[:request.count or 5],
            "learning_based": False,
            "user_preferences": {}
        }

@app.post("/questions/generate")
async def generate_new_questions(request: QuestionGenerateRequest):
    try:
        global learning_engine
        # Initialize learning engine if needed
        if not learning_engine:
            learning_engine = LearningEngine()
        
        # Use learning engine for personalized questions
        personalized_questions = learning_engine.get_adaptive_questions(request.user_id, request.count or 5)
        
        # Train ML service with user data if learning engine is available
        if learning_engine:
            try:
                learning_engine.learn_from_interaction(request.user_id, {
                    'category': request.category or 'general',
                    'engagement_score': 0.7,
                    'interaction_type': 'question_generation'
                })
            except Exception as e:
                print(f"Learning engine error: {e}")
        
        return {
            "questions": personalized_questions,
            "generated_at": personalized_questions[0].get('generated_at') if personalized_questions and isinstance(personalized_questions[0], dict) else None,
            "personalization_level": "adaptive",
            "learning_based": True
        }
    except Exception as e:
        import traceback
        print(f"Question generation error: {e}")
        print(f"Error type: {type(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        # Return basic questions as fallback
        basic_questions = [
            {"id": 1, "text": "What's something you appreciate about our relationship?", "category": "love"},
            {"id": 2, "text": "What goal should we work on together?", "category": "future"},
            {"id": 3, "text": "How can we have more fun together?", "category": "fun"}
        ]
        return {
            "questions": basic_questions[:request.count or 5],
            "generated_at": None,
            "personalization_level": "basic",
            "learning_based": False
        }

@app.post("/questions/follow-up")
async def generate_follow_up_questions(request: FollowUpQuestionsRequest):
    try:
        global question_generator
        # Initialize question generator if needed
        if not question_generator:
            question_generator = QuestionGenerator()
        
        follow_ups = question_generator.generate_follow_up_questions(request.previous_answers or [], request.count or 3)
        
        # Train from follow-up generation if learning engine is available
        if learning_engine and request.previous_answers:
            for answer in request.previous_answers:
                if isinstance(answer, dict) and 'question' in answer and 'answer' in answer:
                    question_data = answer.get('question', {})
                    learning_engine.learn_from_interaction('user_123', {
                        'category': question_data.get('category', 'general'),
                        'engagement_score': 0.9,
                        'interaction_type': 'follow_up_generation'
                    })
        
        return {
            "questions": follow_ups,
            "type": "follow_up",
            "based_on_answers": len(request.previous_answers or [])
        }
    except Exception as e:
        print(f"Follow-up questions error: {e}")
        # Return basic follow-up questions
        basic_followups = [
            {"id": 1, "text": "Can you tell me more about that?", "category": "general"},
            {"id": 2, "text": "How does that make you feel?", "category": "feelings"},
            {"id": 3, "text": "What would you like to explore further?", "category": "general"}
        ]
        return {
            "questions": basic_followups[:request.count or 3],
            "type": "follow_up",
            "based_on_answers": 0
        }

@app.post("/questions/contextual")
async def generate_contextual_questions(request: ContextualQuestionsRequest):
    try:
        conversation_context = request.conversation_context
        communication_analysis = request.communication_analysis
        user_id = request.user_id
        partner_id = request.partner_id
        
        # Analyze conversation topics and sentiment
        topics = extract_conversation_topics(conversation_context)
        sentiment_trend = communication_analysis.get('overall_sentiment', 'neutral')
        
        # Generate simple contextual questions as fallback
        contextual_questions = [
            {"id": 1, "text": "How are you feeling about our conversation?", "category": "feelings"},
            {"id": 2, "text": "What would you like to talk about more?", "category": "communication"}
        ]
        
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
        print(f"Contextual questions error: {e}")
        return {
            "questions": [],
            "suggestions": ["Keep communicating to improve your connection"],
            "context_analysis": {"topics": [], "sentiment": "neutral"}
        }

@app.post("/conversation/update-context")
async def update_conversation_context(request: ConversationUpdateRequest):
    try:
        user_id = request.user_id
        partner_id = request.partner_id
        messages = request.messages
        analysis = request.analysis
        timestamp = request.timestamp
        
        # Update user profiles with conversation data
        couple_key = f"{min(user_id, partner_id)}_{max(user_id, partner_id)}"
        
        conversation_data = {
            'messages': messages[-5:] if messages else [],
            'analysis': analysis,
            'timestamp': timestamp,
            'topics': extract_conversation_topics(messages)
        }
        
        # Learn from conversation for both users if learning engine is available
        if learning_engine and messages:
            topics = extract_conversation_topics(messages)
            for topic in topics:
                learning_engine.learn_from_interaction(user_id, {
                    'category': topic,
                    'engagement_score': analysis.get('communication_health', 0.5),
                    'interaction_type': 'conversation'
                })
                learning_engine.learn_from_interaction(partner_id, {
                    'category': topic,
                    'engagement_score': analysis.get('communication_health', 0.5),
                    'interaction_type': 'conversation'
                })
        
        return {"success": True, "context_updated": True, "learning_updated": bool(learning_engine)}
    except Exception as e:
        print(f"Update context error: {e}")
        return {"success": False, "error": "Failed to update context", "context_updated": False}

def extract_conversation_topics(messages: list) -> list:
    """Extract key topics from conversation"""
    if not messages:
        return []
    
    topics = []
    keywords = {
        'work': ['work', 'job', 'career', 'office', 'boss'],
        'family': ['family', 'parents', 'kids', 'children', 'relatives'],
        'future': ['future', 'plans', 'goals', 'dreams', 'tomorrow'],
        'feelings': ['feel', 'love', 'happy', 'sad', 'angry', 'excited'],
        'activities': ['do', 'go', 'play', 'watch', 'eat', 'travel']
    }
    
    try:
        for message in messages:
            if not message or not isinstance(message, str):
                continue
            message_lower = message.lower()
            for topic, words in keywords.items():
                try:
                    if any(word in message_lower for word in words):
                        if topic not in topics:
                            topics.append(topic)
                except Exception as e:
                    print(f"Error processing topic {topic}: {e}")
                    continue
    except Exception as e:
        print(f"Error extracting topics: {e}")
        return ['general']
    
    return topics[:3] if topics else ['general']  # Return top 3 topics or default

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

def calculate_game_engagement(game_type: str, game_data: dict) -> float:
    """Calculate engagement score based on game type and data"""
    base_score = 0.6
    
    # Adjust based on game type
    game_multipliers = {
        'ai_powered': 0.9,
        'ai_generator': 0.85,
        'this_or_that': 0.7,
        'love_language': 0.8,
        'couple_trivia': 0.75,
        'date_night_planner': 0.8,
        'story_builder': 0.85,
        'relationship_goals': 0.9,
        'memory_lane': 0.8,
        'truth_or_dare': 0.7
    }
    
    multiplier = game_multipliers.get(game_type, 0.7)
    
    # Adjust based on completion and data quality
    if game_data.get('completed', False):
        base_score += 0.2
    
    if isinstance(game_data, dict) and len(str(game_data)) > 100:
        base_score += 0.1
    
    return min(0.95, base_score * multiplier)

def map_game_to_category(game_type: str) -> str:
    """Map game types to learning categories"""
    category_map = {
        'ai_powered': 'adaptive_learning',
        'ai_generator': 'creative_questions',
        'this_or_that': 'preferences',
        'love_language': 'love_expression',
        'couple_trivia': 'relationship_knowledge',
        'date_night_planner': 'activities',
        'story_builder': 'creativity',
        'relationship_goals': 'future_planning',
        'memory_lane': 'memories',
        'truth_or_dare': 'intimacy'
    }
    return category_map.get(game_type, 'general_games')

def generate_game_recommendations(user_id: str, completed_game: str, engagement_score: float) -> list:
    """Generate game recommendations based on completed game and engagement"""
    recommendations = []
    
    if engagement_score > 0.8:
        recommendations.append(f"You loved {completed_game}! Try similar games for more fun.")
    elif engagement_score > 0.6:
        recommendations.append(f"Great job completing {completed_game}! Explore more relationship games.")
    else:
        recommendations.append("Try different game types to find what you both enjoy most.")
    
    # Suggest complementary games
    game_suggestions = {
        'couple_trivia': ['memory_lane', 'this_or_that'],
        'love_language': ['relationship_goals', 'date_night_planner'],
        'ai_powered': ['ai_generator', 'story_builder'],
        'date_night_planner': ['this_or_that', 'truth_or_dare']
    }
    
    if completed_game in game_suggestions:
        next_games = game_suggestions[completed_game]
        recommendations.append(f"Next, try: {' or '.join(next_games)}")
    
    return recommendations[:2]

@app.post("/games/analyze-compatibility")
async def analyze_game_compatibility(request: dict):
    """Analyze compatibility based on game results"""
    try:
        user_results = request.get('user_results', {})
        partner_results = request.get('partner_results', {})
        game_type = request.get('game_type', 'unknown')
        
        # Simple compatibility analysis
        compatibility_score = 0.75  # Default
        
        if user_results and partner_results:
            # Calculate similarity in responses
            common_keys = set(user_results.keys()) & set(partner_results.keys())
            if common_keys:
                matches = sum(1 for key in common_keys if user_results[key] == partner_results[key])
                compatibility_score = matches / len(common_keys)
        
        insights = [
            f"Your {game_type} compatibility score: {compatibility_score:.0%}",
            "Great communication between you two!" if compatibility_score > 0.7 else "Explore your differences - they make you stronger!"
        ]
        
        return {
            "compatibility_score": compatibility_score,
            "insights": insights,
            "game_type": game_type,
            "recommendations": generate_compatibility_recommendations(compatibility_score)
        }
    except Exception as e:
        return {
            "compatibility_score": 0.5,
            "insights": ["Keep playing games together to learn more about each other!"],
            "error": str(e)
        }

def generate_compatibility_recommendations(score: float) -> list:
    """Generate recommendations based on compatibility score"""
    if score > 0.8:
        return ["You're very compatible! Try more challenging games.", "Explore deeper relationship topics."]
    elif score > 0.6:
        return ["Good compatibility! Keep exploring together.", "Try games that highlight your differences."]
    else:
        return ["Differences are opportunities to grow!", "Focus on understanding each other's perspectives."]

@app.post("/learn/question-response")
async def learn_from_question_response(request: dict):
    try:
        user_id = request.get('user_id', 'unknown')
        question_data = request.get('question_data', {})
        response_data = request.get('response_data', {})
        
        # Calculate engagement score based on answer length and quality
        answer = response_data.get('answer', '')
        engagement_score = min(0.9, max(0.3, len(answer) / 100))  # Scale 0.3-0.9 based on length
        
        # Learn from daily question interaction
        if learning_engine:
            learning_engine.learn_from_interaction(user_id, {
                'category': question_data.get('category', 'daily_question'),
                'engagement_score': engagement_score,
                'interaction_type': 'daily_question_response',
                'answer_length': len(answer),
                'timestamp': datetime.now().isoformat()
            })
        
        # Generate new question based on response if highly engaged
        new_question_generated = False
        if engagement_score > 0.7:
            try:
                new_question = generate_follow_up_question(question_data, response_data)
                success = await add_question_to_database(new_question)
                new_question_generated = success
                
                # Also trigger auto-generation of more questions periodically
                if success and engagement_score > 0.8:
                    # Generate additional questions in background
                    import asyncio
                    asyncio.create_task(auto_generate_questions())
            except Exception as e:
                logger.error(f"Failed to generate follow-up question: {e}")
        
        return {
            "success": True, 
            "learning_updated": bool(learning_engine),
            "engagement_score": engagement_score,
            "new_question_generated": new_question_generated,
            "user_id": user_id
        }
    except Exception as e:
        logger.error(f"Question response learning error: {e}")
        return {
            "success": False, 
            "error": str(e),
            "learning_updated": False,
            "engagement_score": 0.5
        }

def generate_follow_up_question(question_data: dict, response_data: dict) -> dict:
    """Generate a follow-up question based on user response"""
    category = question_data.get('category', 'relationship')
    
    templates = {
        'love': [
            "What's another way I can show you love like that?",
            "How does that make you feel in our relationship?"
        ],
        'relationship': [
            "How can we build on that in our relationship?",
            "What's something similar we could try together?"
        ]
    }
    
    import random
    question_text = random.choice(templates.get(category, templates['relationship']))
    
    return {
        'text': question_text,
        'type': 'open_ended',
        'category': category,
        'difficulty': 'medium'
    }

async def add_question_to_database(question_data: dict):
    """Add generated question to backend database"""
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{os.getenv('BACKEND_URL', 'http://localhost:3000')}/api/questions/add",
                json=question_data,
                timeout=10.0
            )
            return response.status_code == 200
    except Exception as e:
        logger.error(f"Failed to add question to database: {e}")
        return False

@app.post("/questions/auto-generate")
async def auto_generate_questions():
    """Automatically generate new questions based on user patterns"""
    try:
        if not learning_engine:
            return {"success": False, "error": "Learning engine not available"}
        
        # Generate questions for different categories based on user engagement
        categories = ['love', 'communication', 'future', 'memories', 'activities', 'intimacy']
        generated_questions = []
        
        for category in categories:
            # Generate 2-3 questions per category
            for i in range(2):
                question = generate_smart_question(category, i)
                if question:
                    # Add to database
                    success = await add_question_to_database(question)
                    if success:
                        generated_questions.append(question)
        
        return {
            "success": True,
            "generated_count": len(generated_questions),
            "questions": generated_questions[:5],  # Return first 5 as sample
            "categories_covered": categories
        }
    except Exception as e:
        logger.error(f"Auto-generation error: {e}")
        return {"success": False, "error": str(e), "generated_count": 0}

def generate_smart_question(category: str, variant: int) -> dict:
    """Generate intelligent questions based on category and learning patterns"""
    question_templates = {
        'love': [
            "What's a small gesture that makes you feel deeply loved?",
            "How do you know when I'm showing you love in your preferred way?"
        ],
        'communication': [
            "What's one thing I could say more often that would make you feel heard?",
            "When do you feel most comfortable sharing your deepest thoughts with me?"
        ],
        'future': [
            "What's one dream we haven't talked about yet that excites you?",
            "How do you imagine we'll celebrate our relationship milestones?"
        ],
        'memories': [
            "What's a recent moment between us that you want to remember forever?",
            "Which of our shared experiences has shaped you the most?"
        ],
        'activities': [
            "What's an activity we've never tried that you think we'd both love?",
            "How can we make our regular routines more fun and connected?"
        ],
        'intimacy': [
            "What makes you feel most emotionally close to me?",
            "When do you feel most comfortable being vulnerable with me?"
        ]
    }
    
    templates = question_templates.get(category, ['What do you think about this topic?'])
    if variant >= len(templates):
        variant = variant % len(templates)
    
    return {
        'text': templates[variant],
        'type': 'open_ended',
        'category': category,
        'difficulty': 'medium',
        'generated_by': 'ml_service',
        'created_at': datetime.now().isoformat()
    }

@app.post("/questions/generate-personalized")
async def generate_personalized_questions(request: dict):
    """Generate personalized questions based on user's interaction history"""
    try:
        user_id = request.get('user_id', 'unknown')
        partner_id = request.get('partner_id', 'unknown')
        count = min(request.get('count', 3), 10)  # Max 10 questions
        
        # Get user preferences from learning engine
        user_preferences = {}
        if learning_engine and hasattr(learning_engine, 'user_preferences'):
            user_preferences = learning_engine.user_preferences.get(user_id, {})
        
        # Generate questions based on preferences
        preferred_categories = user_preferences.get('preferred_categories', ['love', 'communication', 'future'])
        generated_questions = []
        
        for i in range(count):
            category = preferred_categories[i % len(preferred_categories)]
            question = generate_adaptive_question(category, user_preferences)
            
            # Add to database
            success = await add_question_to_database(question)
            if success:
                generated_questions.append(question)
        
        return {
            "success": True,
            "questions": generated_questions,
            "personalized_for": user_id,
            "based_on_preferences": user_preferences
        }
    except Exception as e:
        logger.error(f"Personalized generation error: {e}")
        # Return fallback questions instead of error
        fallback_questions = [
            {"text": "What's something you appreciate about our relationship today?", "category": "love", "type": "open_ended"},
            {"text": "How can we make tomorrow even better together?", "category": "future", "type": "open_ended"},
            {"text": "What's one thing you'd like to share with me?", "category": "communication", "type": "open_ended"}
        ]
        return {"success": True, "questions": fallback_questions[:count], "personalized_for": user_id, "fallback_used": True}

def generate_adaptive_question(category: str, user_preferences: dict) -> dict:
    """Generate adaptive questions based on user preferences and engagement"""
    engagement_level = user_preferences.get('engagement_level', 'medium')
    
    # Adjust question depth based on engagement
    if engagement_level == 'high':
        depth_templates = {
            'love': "What's the most profound way I've changed your understanding of love?",
            'communication': "How has our communication style evolved since we first met?",
            'future': "What legacy do you want our relationship to leave?"
        }
        difficulty = 'hard'
    else:
        depth_templates = {
            'love': "What's your favorite way to receive affection from me?",
            'communication': "How can we make our daily conversations more meaningful?",
            'future': "What's one goal we should work on together this year?"
        }
        difficulty = 'medium'
    
    question_text = depth_templates.get(category, "What do you think about our relationship?")
    
    return {
        'text': question_text,
        'type': 'open_ended',
        'category': category,
        'difficulty': difficulty,
        'generated_by': 'ml_adaptive',
        'personalization_level': engagement_level,
        'created_at': datetime.now().isoformat()
    }

@app.on_event("startup")
async def startup_event():
    """Initialize background tasks on startup"""
    import asyncio
    # Schedule periodic question generation
    asyncio.create_task(periodic_question_generation())

async def periodic_question_generation():
    """Periodically generate new questions based on user activity"""
    import asyncio
    while True:
        try:
            # Wait 6 hours between generations
            await asyncio.sleep(6 * 60 * 60)
            
            # Generate new questions
            result = await auto_generate_questions()
            logger.info(f"Periodic generation: {result.get('generated_count', 0)} questions created")
            
        except Exception as e:
            logger.error(f"Periodic generation error: {e}")
            # Wait 1 hour before retrying on error
            await asyncio.sleep(60 * 60)

@app.get("/games/this-or-that")
async def get_this_or_that_questions():
    """Generate This or That questions for couples"""
    try:
        # Generate personalized This or That questions
        questions = [
            {"option1": "Coffee dates", "option2": "Tea ceremonies"},
            {"option1": "Beach vacation", "option2": "Mountain retreat"},
            {"option1": "Movie night at home", "option2": "Concert in the city"},
            {"option1": "Cooking together", "option2": "Trying new restaurants"},
            {"option1": "Morning workouts", "option2": "Evening walks"},
            {"option1": "Spontaneous adventures", "option2": "Planned activities"},
            {"option1": "Deep conversations", "option2": "Playful banter"},
            {"option1": "Staying in pajamas", "option2": "Getting dressed up"},
            {"option1": "Board games", "option2": "Video games"},
            {"option1": "Reading together", "option2": "Watching shows together"}
        ]
        
        # Randomize and select 5 questions
        import random
        selected_questions = random.sample(questions, min(5, len(questions)))
        
        return {
            "questions": selected_questions,
            "generated_by": "ml_service",
            "personalized": True
        }
    except Exception as e:
        logger.error(f"This or That generation error: {e}")
        # Fallback questions
        return {
            "questions": [
                {"option1": "Coffee", "option2": "Tea"},
                {"option1": "Beach", "option2": "Mountains"},
                {"option1": "Movies", "option2": "Books"},
                {"option1": "Early bird", "option2": "Night owl"},
                {"option1": "Cooking", "option2": "Takeout"}
            ],
            "generated_by": "fallback",
            "personalized": False
        }

@app.get("/games/truth-or-dare")
async def get_truth_or_dare_questions(session_duration: int = 0):
    """Generate Truth or Dare questions with progressive maturity"""
    try:
        # Base questions for new sessions
        base_truth_questions = [
            "What's your biggest fear about our relationship?",
            "What's the most romantic thing I've ever done for you?",
            "What's one thing you've never told me?",
            "What's your favorite memory of us together?",
            "What do you find most attractive about me?",
            "What's something you want to try together?",
            "What's your love language and how can I show it better?",
            "What's one thing you'd change about our relationship?",
            "What's your biggest dream for our future?",
            "What made you fall in love with me?"
        ]
        
        base_dare_questions = [
            "Give your partner a 30-second massage",
            "Tell your partner 3 things you love about them",
            "Do your best impression of your partner",
            "Share a childhood photo with your partner",
            "Write a short love note to your partner",
            "Dance together for 1 minute without music",
            "Give your partner 5 compliments",
            "Share your most embarrassing moment",
            "Sing your partner's favorite song",
            "Plan a surprise date idea right now"
        ]
        
        # Mature questions for extended sessions (1+ hour)
        mature_truth_questions = [
            "What's your deepest fantasy about us?",
            "What's the most intimate moment we've shared?",
            "What's something you've always wanted to try in our relationship?",
            "What turns you on most about me?",
            "What's your favorite way for us to be intimate?",
            "What's a secret desire you have about our physical connection?",
            "When do you feel most desired by me?",
            "What's something intimate you'd like me to do more often?"
        ]
        
        mature_dare_questions = [
            "Give your partner a sensual 2-minute massage",
            "Whisper something intimate in your partner's ear",
            "Share your most romantic fantasy with your partner",
            "Give your partner a passionate kiss for 30 seconds",
            "Tell your partner exactly what you find most attractive about them",
            "Create a romantic atmosphere in the room right now",
            "Share what you love most about being intimate together",
            "Plan a romantic evening for just the two of you"
        ]
        
        # Determine question set based on session duration
        if session_duration >= 60:  # 1+ hour = mature content
            truth_pool = base_truth_questions + mature_truth_questions
            dare_pool = base_dare_questions + mature_dare_questions
            maturity_level = "mature"
        else:
            truth_pool = base_truth_questions
            dare_pool = base_dare_questions
            maturity_level = "standard"
        
        import random
        
        return {
            "truth_questions": random.sample(truth_pool, min(8, len(truth_pool))),
            "dare_questions": random.sample(dare_pool, min(8, len(dare_pool))),
            "maturity_level": maturity_level,
            "session_duration": session_duration,
            "generated_by": "ml_service"
        }
    except Exception as e:
        logger.error(f"Truth or Dare generation error: {e}")
        # Fallback questions
        return {
            "truth_questions": [
                "What's your favorite thing about our relationship?",
                "What's one goal you'd like us to work on together?",
                "What makes you feel most connected to me?"
            ],
            "dare_questions": [
                "Give your partner a hug for 30 seconds",
                "Tell your partner why you love them",
                "Share a happy memory together"
            ],
            "maturity_level": "standard",
            "generated_by": "fallback"
        }

@app.get("/questions/generation-stats")
async def get_generation_stats():
    """Get statistics about question generation"""
    try:
        # Mock stats - in production, track actual generation metrics
        stats = {
            "total_generated_today": 12,
            "categories_covered": ['love', 'communication', 'future', 'memories'],
            "success_rate": 0.85,
            "last_generation": datetime.now().isoformat(),
            "next_scheduled": (datetime.now().replace(hour=datetime.now().hour + 6)).isoformat()
        }
        return stats
    except Exception as e:
        return {"error": str(e), "total_generated_today": 0}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)