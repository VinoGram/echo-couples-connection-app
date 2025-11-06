from typing import Dict, List, Tuple
import random
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class RecommendationEngine:
    def __init__(self):
        self.activity_database = {
            'communication': [
                "Practice active listening exercises",
                "Schedule weekly check-in conversations",
                "Try the 'Daily Highs and Lows' sharing ritual",
                "Use 'I' statements when discussing concerns",
                "Set aside phone-free conversation time"
            ],
            'values': [
                "Discuss your core values and priorities",
                "Create a shared vision board",
                "Explore each other's family traditions",
                "Share your life philosophies",
                "Discuss what success means to each of you"
            ],
            'lifestyle': [
                "Plan activities that blend both your interests",
                "Try alternating who chooses weekend activities",
                "Establish shared daily routines",
                "Create a bucket list together",
                "Find a new hobby to explore together"
            ],
            'intimacy': [
                "Schedule regular date nights",
                "Practice expressing appreciation daily",
                "Explore new ways to show affection",
                "Share your love languages",
                "Create intimate rituals together"
            ],
            'goals': [
                "Create a shared 5-year plan",
                "Set monthly relationship goals together",
                "Celebrate each other's achievements",
                "Support each other's personal growth",
                "Plan future adventures together"
            ],
            'personality': [
                "Take personality tests together and discuss results",
                "Practice patience with different communication styles",
                "Find activities that suit both personalities",
                "Appreciate your complementary differences",
                "Learn each other's stress responses"
            ]
        }
        
        self.game_recommendations = {
            'new_relationship': ['love_language', 'this_or_that', 'story_builder'],
            'established_relationship': ['couple_trivia', 'memory_lane', 'relationship_goals'],
            'communication_focus': ['truth_or_dare', 'story_builder', 'relationship_goals'],
            'fun_focus': ['this_or_that', 'story_builder', 'date_night_planner'],
            'growth_focus': ['love_language', 'relationship_goals', 'couple_trivia']
        }
    
    def recommend_games(self, user_preferences: Dict, interaction_history: List[Dict]) -> List[str]:
        # Analyze user preferences and history to recommend games
        played_games = [interaction.get('game_type') for interaction in interaction_history]
        game_counts = {game: played_games.count(game) for game in set(played_games) if game}
        
        # Determine relationship stage and focus
        total_interactions = len(interaction_history)
        
        if total_interactions < 10:
            focus = 'new_relationship'
        elif user_preferences.get('focus') == 'communication':
            focus = 'communication_focus'
        elif user_preferences.get('focus') == 'fun':
            focus = 'fun_focus'
        else:
            focus = 'growth_focus'
        
        recommended = self.game_recommendations.get(focus, [])
        
        # Filter out overplayed games
        filtered_recommendations = [
            game for game in recommended 
            if game_counts.get(game, 0) < 3
        ]
        
        return filtered_recommendations[:3] if filtered_recommendations else recommended[:3]
    
    def generate_personalized_recommendations(self, 
                                           compatibility_score: float,
                                           category_scores: Dict[str, float]) -> List[str]:
        recommendations = []
        
        # Overall relationship advice
        if compatibility_score > 0.8:
            recommendations.append("Maintain your strong connection with regular quality time")
        elif compatibility_score > 0.6:
            recommendations.append("Build on your solid foundation with targeted improvements")
        else:
            recommendations.append("Focus on fundamental relationship building")
        
        # Category-specific recommendations
        weak_areas = [cat for cat, score in category_scores.items() if score < 0.6]
        
        for category in weak_areas[:3]:  # Focus on top 3 areas
            activities = self.activity_database.get(category, [])
            if activities:
                recommendations.append(random.choice(activities))
        
        return recommendations
    
    def get_daily_tip(self, focus_category: str = None) -> str:
        if focus_category and focus_category in self.activity_database:
            return random.choice(self.activity_database[focus_category])
        
        # Random tip from any category
        all_tips = [tip for tips in self.activity_database.values() for tip in tips]
        return random.choice(all_tips)
    
    def adaptive_difficulty_adjustment(self, user_performance: Dict, question_difficulty: str) -> str:
        """Adjust question difficulty based on user performance"""
        success_rate = user_performance.get('success_rate', 0.5)
        
        if success_rate > 0.8 and question_difficulty != 'hard':
            return 'hard'
        elif success_rate < 0.4 and question_difficulty != 'easy':
            return 'easy'
        else:
            return 'medium'
    
    def generate_date_suggestions(self, preferences: Dict) -> List[Dict]:
        """Generate personalized date suggestions"""
        budget = preferences.get('budget', 'medium')
        location = preferences.get('location', 'city')
        mood = preferences.get('mood', 'romantic')
        
        suggestions = {
            'free-home-romantic': {
                'title': 'Cozy Home Date',
                'activities': ['Cook dinner together', 'Watch sunset', 'Share stories'],
                'cost': '$0'
            },
            'low-outdoor-fun': {
                'title': 'Adventure Picnic',
                'activities': ['Pack lunch', 'Find scenic spot', 'Play outdoor games'],
                'cost': '$10-25'
            },
            'medium-city-romantic': {
                'title': 'City Romance',
                'activities': ['Nice restaurant', 'Evening walk', 'Coffee shop'],
                'cost': '$50-100'
            }
        }
        
        key = f"{budget}-{location}-{mood}"
        return [suggestions.get(key, suggestions['medium-city-romantic'])]