import numpy as np
from typing import Dict, List, Any
from sklearn.metrics.pairwise import cosine_similarity
from .models import CompatibilityResponse, RelationshipInsightResponse

class CompatibilityAnalyzer:
    def __init__(self):
        self.category_weights = {
            'communication': 0.25,
            'values': 0.20,
            'lifestyle': 0.15,
            'intimacy': 0.15,
            'goals': 0.15,
            'personality': 0.10
        }
    
    def analyze(self, user1_answers: Dict[str, Any], user2_answers: Dict[str, Any]) -> CompatibilityResponse:
        # Calculate category scores
        category_scores = {}
        
        for category in self.category_weights.keys():
            score = self._calculate_category_compatibility(
                user1_answers.get(category, {}),
                user2_answers.get(category, {})
            )
            category_scores[category] = score
        
        # Calculate overall compatibility
        overall_score = sum(
            score * self.category_weights[category]
            for category, score in category_scores.items()
        )
        
        # Generate insights and recommendations
        insights = self._generate_insights(category_scores, overall_score)
        recommendations = self._generate_recommendations(category_scores)
        
        return CompatibilityResponse(
            compatibility_score=round(overall_score, 2),
            category_scores=category_scores,
            insights=insights,
            recommendations=recommendations
        )
    
    def _calculate_category_compatibility(self, answers1: Dict, answers2: Dict) -> float:
        if not answers1 or not answers2:
            return 0.5  # Neutral score for missing data
        
        # Convert answers to numerical vectors
        vector1 = self._answers_to_vector(answers1)
        vector2 = self._answers_to_vector(answers2)
        
        if len(vector1) == 0 or len(vector2) == 0:
            return 0.5
        
        # Calculate similarity
        similarity = cosine_similarity([vector1], [vector2])[0][0]
        return max(0, min(1, (similarity + 1) / 2))  # Normalize to 0-1
    
    def _answers_to_vector(self, answers: Dict) -> List[float]:
        vector = []
        for key, value in answers.items():
            if isinstance(value, (int, float)):
                vector.append(float(value))
            elif isinstance(value, bool):
                vector.append(1.0 if value else 0.0)
            elif isinstance(value, str):
                vector.append(hash(value) % 100 / 100.0)  # Simple string hash
        return vector
    
    def _generate_insights(self, category_scores: Dict[str, float], overall_score: float) -> List[str]:
        insights = []
        
        if overall_score > 0.8:
            insights.append("You have excellent compatibility across most areas!")
        elif overall_score > 0.6:
            insights.append("You have good compatibility with room for growth in some areas.")
        else:
            insights.append("There are significant differences that require attention and communication.")
        
        # Category-specific insights
        strong_areas = [cat for cat, score in category_scores.items() if score > 0.7]
        weak_areas = [cat for cat, score in category_scores.items() if score < 0.5]
        
        if strong_areas:
            insights.append(f"Your strongest areas: {', '.join(strong_areas)}")
        
        if weak_areas:
            insights.append(f"Areas needing attention: {', '.join(weak_areas)}")
        
        return insights
    
    def _generate_recommendations(self, category_scores: Dict[str, float]) -> List[str]:
        recommendations = []
        
        # Focus on weakest areas
        sorted_categories = sorted(category_scores.items(), key=lambda x: x[1])
        
        for category, score in sorted_categories[:3]:  # Top 3 areas to improve
            if score < 0.7:
                if category == 'communication':
                    recommendations.append("Practice daily check-ins and active listening")
                elif category == 'values':
                    recommendations.append("Discuss your core values and find common ground")
                elif category == 'lifestyle':
                    recommendations.append("Find activities you both enjoy and create shared routines")
                elif category == 'intimacy':
                    recommendations.append("Schedule regular quality time and express appreciation")
                elif category == 'goals':
                    recommendations.append("Create shared goals and support each other's dreams")
                elif category == 'personality':
                    recommendations.append("Embrace your differences and find complementary strengths")
        
        return recommendations
    
    def generate_insights(self, interaction_history: List[Dict[str, Any]]) -> RelationshipInsightResponse:
        # Analyze interaction patterns
        total_interactions = len(interaction_history)
        
        if total_interactions == 0:
            return RelationshipInsightResponse(
                overall_health_score=0.5,
                communication_score=0.5,
                engagement_score=0.5,
                trends={},
                insights=["Not enough data to generate insights"],
                recommendations=["Start engaging more with the app to get personalized insights"]
            )
        
        # Calculate scores based on interaction patterns
        communication_score = min(1.0, total_interactions / 30)  # Normalize by expected monthly interactions
        engagement_score = self._calculate_engagement_score(interaction_history)
        overall_health_score = (communication_score + engagement_score) / 2
        
        # Generate trends (simplified)
        trends = {
            "daily_activity": [0.5 + np.random.normal(0, 0.1) for _ in range(7)],
            "compatibility_trend": [0.6 + np.random.normal(0, 0.05) for _ in range(30)]
        }
        
        insights = [
            f"You've had {total_interactions} interactions this month",
            f"Your engagement level is {'high' if engagement_score > 0.7 else 'moderate' if engagement_score > 0.4 else 'low'}"
        ]
        
        recommendations = [
            "Continue regular interactions to strengthen your bond",
            "Try new games to discover more about each other"
        ]
        
        return RelationshipInsightResponse(
            overall_health_score=round(overall_health_score, 2),
            communication_score=round(communication_score, 2),
            engagement_score=round(engagement_score, 2),
            trends=trends,
            insights=insights,
            recommendations=recommendations
        )
    
    def _calculate_engagement_score(self, interactions: List[Dict[str, Any]]) -> float:
        if not interactions:
            return 0.0
        
        # Simple engagement calculation based on interaction frequency and variety
        game_types = set(interaction.get('game_type', 'unknown') for interaction in interactions)
        variety_score = min(1.0, len(game_types) / 5)  # Normalize by expected game variety
        
        frequency_score = min(1.0, len(interactions) / 20)  # Normalize by expected frequency
        
        return (variety_score + frequency_score) / 2