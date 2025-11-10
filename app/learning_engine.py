import json
from datetime import datetime
from typing import Dict, List, Any
import random

class LearningEngine:
    def __init__(self):
        self.user_preferences = {}
        self.interaction_history = {}
        # Quiz-style questions with multiple choice format
        self.question_templates = {
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
            ],
            'activities': [
                "I prefer activities that are:",
                "My ideal way to spend time together is:",
                "I'm most interested in trying:",
                "When choosing activities, I prioritize:",
                "I feel most engaged when we:"
            ],
            'memories': [
                "My favorite type of memories with you involve:",
                "I treasure moments when we:",
                "The memories that mean most to me are:",
                "I love remembering times when we:",
                "Our best memories happen when we:"
            ],
            'relationship': [
                "What makes our relationship unique is:",
                "I value most in our partnership:",
                "Our relationship works best when we:",
                "I'm proudest of how we:",
                "The foundation of our relationship is:"
            ],
            'general': [
                "In relationships, I value most:",
                "My communication style is typically:",
                "I handle stress best when:",
                "I feel most supported when:",
                "My approach to problem-solving is:"
            ]
        }
    
    def learn_from_interaction(self, user_id: str, interaction_data: Dict[str, Any]):
        """Learn from user interactions to improve question generation"""
        if user_id not in self.user_preferences:
            self.user_preferences[user_id] = {
                'preferred_categories': {},
                'engagement_patterns': {},
                'response_depth': 'medium',
                'interaction_count': 0
            }
        
        # Update preferences based on interaction
        category = interaction_data.get('category', 'general')
        engagement = interaction_data.get('engagement_score', 0.5)
        
        prefs = self.user_preferences[user_id]
        prefs['interaction_count'] += 1
        
        # Track category preferences
        if category not in prefs['preferred_categories']:
            prefs['preferred_categories'][category] = 0
        prefs['preferred_categories'][category] += engagement
        
        # Store interaction history
        if user_id not in self.interaction_history:
            self.interaction_history[user_id] = []
        
        self.interaction_history[user_id].append({
            'timestamp': datetime.now().isoformat(),
            'data': interaction_data
        })
    
    def generate_personalized_question(self, user_id: str, partner_id: str = None) -> Dict[str, Any]:
        """Generate a personalized quiz question based on learning"""
        user_prefs = self.user_preferences.get(user_id, {})
        preferred_cats = user_prefs.get('preferred_categories', {})
        
        # Choose category based on preferences or random
        if preferred_cats:
            # Filter to only categories that exist in templates
            valid_cats = {k: v for k, v in preferred_cats.items() if k in self.question_templates}
            if valid_cats:
                category = max(valid_cats.keys(), key=lambda k: valid_cats[k])
            else:
                category = 'general'
        else:
            category = random.choice(list(self.question_templates.keys()))
        
        # Fallback to general if category doesn't exist
        if category not in self.question_templates:
            category = 'general'
        
        # Generate quiz-style question
        template = random.choice(self.question_templates[category])
        
        return {
            'id': f"generated_{datetime.now().timestamp()}",
            'text': template,
            'category': category,
            'depth': self._determine_depth(user_prefs),
            'type': 'multiple_choice',
            'personalized': True,
            'generated_at': datetime.now().isoformat()
        }
    
    def _determine_depth(self, user_prefs: Dict) -> str:
        """Determine question depth based on user engagement"""
        interaction_count = user_prefs.get('interaction_count', 0)
        if interaction_count > 10:
            return 'deep'
        elif interaction_count > 5:
            return 'medium'
        return 'light'
    
    def get_adaptive_questions(self, user_id: str, count: int = 5) -> List[Dict[str, Any]]:
        """Get multiple adaptive questions"""
        questions = []
        for _ in range(count):
            question = self.generate_personalized_question(user_id)
            questions.append(question)
        return questions