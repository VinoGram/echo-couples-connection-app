from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class CompatibilityRequest(BaseModel):
    user1_answers: Dict[str, Any]
    user2_answers: Dict[str, Any]
    question_weights: Optional[Dict[str, float]] = None

class CompatibilityResponse(BaseModel):
    compatibility_score: float
    category_scores: Dict[str, float]
    insights: List[str]
    recommendations: List[str]

class SentimentRequest(BaseModel):
    text: str
    context: Optional[str] = None

class SentimentResponse(BaseModel):
    sentiment: str
    confidence: float
    emotions: Dict[str, float]

class QuestionRecommendationRequest(BaseModel):
    user_id: str
    partner_id: str
    answered_questions: List[str]
    preferences: Optional[Dict[str, Any]] = None

class QuestionRecommendationResponse(BaseModel):
    recommended_questions: List[Dict[str, Any]]
    reasoning: List[str]

class RelationshipInsightRequest(BaseModel):
    couple_id: str
    interaction_history: List[Dict[str, Any]]
    timeframe_days: Optional[int] = 30

class RelationshipInsightResponse(BaseModel):
    overall_health_score: float
    communication_score: float
    engagement_score: float
    trends: Dict[str, List[float]]
    insights: List[str]
    recommendations: List[str]