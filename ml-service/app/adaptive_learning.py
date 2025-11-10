import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from typing import Dict, List, Any, Tuple
import json
from datetime import datetime

class AdaptiveLearningEngine:
    def __init__(self):
        self.question_classifier = DecisionTreeClassifier(random_state=42)
        self.difficulty_classifier = RandomForestClassifier(n_estimators=10, random_state=42)
        self.user_profiles = {}
        self.question_history = {}
        self.is_trained = False
        
    def update_user_profile(self, user_id: str, game_data: Dict[str, Any]):
        """Update user profile with new game data"""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = {
                'games_played': 0,
                'avg_score': 0,
                'preferred_categories': {},
                'difficulty_performance': {'easy': [], 'medium': [], 'hard': []},
                'engagement_scores': [],
                'question_preferences': {}
            }
        
        profile = self.user_profiles[user_id]
        profile['games_played'] += 1
        
        # Update average score
        new_score = game_data.get('score', 0)
        games_count = profile['games_played']
        profile['avg_score'] = (profile['avg_score'] * (games_count - 1) + new_score) / games_count
        
        # Update category preferences
        category = game_data.get('category', 'general')
        profile['preferred_categories'][category] = profile['preferred_categories'].get(category, 0) + 1
        
        # Update difficulty performance
        difficulty = game_data.get('difficulty', 'medium')
        if difficulty in profile['difficulty_performance']:
            profile['difficulty_performance'][difficulty].append(new_score)
        
        # Update engagement
        engagement = game_data.get('engagement_score', 0.5)
        profile['engagement_scores'].append(engagement)
        
        # Track question responses
        for question_id, response in game_data.get('responses', {}).items():
            if question_id not in profile['question_preferences']:
                profile['question_preferences'][question_id] = []
            profile['question_preferences'][question_id].append(response)
    
    def get_optimal_difficulty(self, user_id: str) -> str:
        """Determine optimal difficulty for user"""
        if user_id not in self.user_profiles:
            return 'medium'
        
        profile = self.user_profiles[user_id]
        difficulty_scores = {}
        
        for difficulty, scores in profile['difficulty_performance'].items():
            if scores:
                avg_score = np.mean(scores)
                difficulty_scores[difficulty] = avg_score
        
        if not difficulty_scores:
            return 'medium'
        
        # Find difficulty with best performance
        best_diff_name, best_score = max(difficulty_scores.items(), key=lambda x: x[1])
        
        # If performing well on current difficulty, suggest harder
        if best_difficulty[1] > 0.8 and best_difficulty[0] != 'hard':
            difficulty_order = ['easy', 'medium', 'hard']
            current_idx = difficulty_order.index(best_difficulty[0])
            return difficulty_order[min(current_idx + 1, 2)]
        
        return best_difficulty[0]
    
    def select_questions(self, user_id: str, partner_id: str, available_questions: List[Dict], count: int = 5) -> List[Dict]:
        """Select optimal questions using decision tree"""
        if not available_questions:
            return []
        
        # Filter out recently asked questions
        filtered_questions = self._filter_recent_questions(user_id, partner_id, available_questions)
        
        if len(filtered_questions) < count:
            filtered_questions = available_questions
        
        # Score questions based on user preferences and learning
        scored_questions = []
        for question in filtered_questions:
            score = self._score_question(user_id, partner_id, question)
            scored_questions.append((question, score))
        
        # Sort by score and return top questions
        scored_questions.sort(key=lambda x: x[1], reverse=True)
        return [q[0] for q in scored_questions[:count]]
    
    def _filter_recent_questions(self, user_id: str, partner_id: str, questions: List[Dict]) -> List[Dict]:
        """Filter out questions asked in last 3 games"""
        couple_key = f"{min(user_id, partner_id)}_{max(user_id, partner_id)}"
        
        if couple_key not in self.question_history:
            return questions
        
        recent_questions = set()
        history = self.question_history[couple_key]
        
        # Get last 3 games worth of questions
        for game in history[-3:]:
            recent_questions.update(game.get('question_ids', []))
        
        return [q for q in questions if q.get('id') not in recent_questions]
    
    def _score_question(self, user_id: str, partner_id: str, question: Dict) -> float:
        """Score question based on user preferences and learning objectives"""
        score = 0.5  # Base score
        
        # User preference scoring
        if user_id in self.user_profiles:
            profile = self.user_profiles[user_id]
            
            # Category preference
            category = question.get('category', 'general')
            if category in profile['preferred_categories']:
                category_weight = profile['preferred_categories'][category] / profile['games_played']
                score += category_weight * 0.3
            
            # Difficulty matching
            optimal_difficulty = self.get_optimal_difficulty(user_id)
            if question.get('difficulty') == optimal_difficulty:
                score += 0.2
            
            # Novelty bonus (questions not answered before)
            question_id = question.get('id')
            if question_id not in profile['question_preferences']:
                score += 0.3
        
        # Engagement prediction
        question_type = question.get('type', 'open_ended')
        if question_type in ['this_or_that', 'multiple_choice']:
            score += 0.1  # These tend to be more engaging
        
        return min(score, 1.0)
    
    def record_game_session(self, user_id: str, partner_id: str, game_data: Dict):
        """Record game session for learning"""
        couple_key = f"{min(user_id, partner_id)}_{max(user_id, partner_id)}"
        
        if couple_key not in self.question_history:
            self.question_history[couple_key] = []
        
        session_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'question_ids': game_data.get('question_ids', []),
            'user_responses': {user_id: game_data.get('user_responses', {})},
            'scores': {user_id: game_data.get('score', 0)},
            'engagement': game_data.get('engagement_score', 0.5)
        }
        
        self.question_history[couple_key].append(session_data)
        
        # Update user profiles with error handling
        try:
            self.update_user_profile(user_id, game_data)
            if partner_id and partner_id != user_id:
                partner_data = game_data.get('partner_data', {})
                if partner_data:
                    self.update_user_profile(partner_id, partner_data)
        except Exception as e:
            print(f"Error updating user profiles: {e}")
    
    def get_learning_insights(self, user_id: str) -> Dict[str, Any]:
        """Generate learning insights for user"""
        if user_id not in self.user_profiles:
            return {'message': 'Not enough data for insights'}
        
        profile = self.user_profiles[user_id]
        
        # Performance trends
        recent_engagement = profile['engagement_scores'][-5:] if profile['engagement_scores'] else [0.5]
        avg_engagement = np.mean(recent_engagement)
        
        # Preferred categories
        top_categories = sorted(
            profile['preferred_categories'].items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:3]
        
        # Difficulty analysis
        difficulty_analysis = {}
        for difficulty, scores in profile['difficulty_performance'].items():
            if scores:
                difficulty_analysis[difficulty] = {
                    'avg_score': np.mean(scores),
                    'games_played': len(scores)
                }
        
        return {
            'games_played': profile['games_played'],
            'avg_score': round(profile['avg_score'], 2),
            'engagement_level': 'high' if avg_engagement > 0.7 else 'medium' if avg_engagement > 0.4 else 'low',
            'preferred_categories': [cat[0] for cat in top_categories],
            'optimal_difficulty': self.get_optimal_difficulty(user_id),
            'difficulty_performance': difficulty_analysis,
            'improvement_suggestions': self._generate_suggestions(profile)
        }
    
    def _generate_suggestions(self, profile: Dict) -> List[str]:
        """Generate improvement suggestions"""
        suggestions = []
        
        avg_score = profile['avg_score']
        if avg_score < 0.5:
            suggestions.append("Try easier questions to build confidence")
        elif avg_score > 0.8:
            suggestions.append("Challenge yourself with harder questions")
        
        if len(profile['preferred_categories']) < 3:
            suggestions.append("Explore different question categories")
        
        recent_engagement = profile['engagement_scores'][-3:] if profile['engagement_scores'] else [0.5]
        if np.mean(recent_engagement) < 0.5:
            suggestions.append("Try more interactive question types")
        
        return suggestions
    
    def update_conversation_context(self, couple_key: str, conversation_data: Dict):
        """Update conversation context for better question generation"""
        if not hasattr(self, 'conversation_contexts'):
            self.conversation_contexts = {}
        
        if couple_key not in self.conversation_contexts:
            self.conversation_contexts[couple_key] = []
        
        self.conversation_contexts[couple_key].append(conversation_data)
        
        # Keep only last 10 conversation contexts
        contexts = self.conversation_contexts[couple_key]
        if len(contexts) > 10:
            self.conversation_contexts[couple_key] = contexts[-10:]
        
        # Update user profiles based on conversation topics
        topics = conversation_data.get('topics', [])
        # TODO: Implement topic-based preference updates
        return len(topics)  # Return number of topics processed