import random
from typing import List, Dict, Any
from .models import QuestionRecommendationResponse

class QuestionRecommender:
    def __init__(self):
        self.question_bank = {
            'communication': [
                {
                    'id': 'comm_1',
                    'text': 'What is one thing I do that makes you feel most heard?',
                    'category': 'communication',
                    'difficulty': 'medium',
                    'type': 'open_ended'
                },
                {
                    'id': 'comm_2', 
                    'text': 'How do you prefer to resolve conflicts?',
                    'category': 'communication',
                    'difficulty': 'hard',
                    'type': 'open_ended'
                },
                {
                    'id': 'comm_3',
                    'text': 'What topic do you wish we talked about more?',
                    'category': 'communication', 
                    'difficulty': 'easy',
                    'type': 'open_ended'
                }
            ],
            'intimacy': [
                {
                    'id': 'int_1',
                    'text': 'What makes you feel most connected to me?',
                    'category': 'intimacy',
                    'difficulty': 'medium',
                    'type': 'open_ended'
                },
                {
                    'id': 'int_2',
                    'text': 'What is your favorite way to show affection?',
                    'category': 'intimacy',
                    'difficulty': 'easy',
                    'type': 'multiple_choice',
                    'options': ['Physical touch', 'Words of affirmation', 'Quality time', 'Acts of service']
                },
                {
                    'id': 'int_3',
                    'text': 'What is one romantic gesture that always melts your heart?',
                    'category': 'intimacy',
                    'difficulty': 'medium',
                    'type': 'open_ended'
                }
            ],
            'fun': [
                {
                    'id': 'fun_1',
                    'text': 'If we could travel anywhere together, where would you choose?',
                    'category': 'fun',
                    'difficulty': 'easy',
                    'type': 'open_ended'
                },
                {
                    'id': 'fun_2',
                    'text': 'What is the silliest thing we have done together?',
                    'category': 'fun',
                    'difficulty': 'easy',
                    'type': 'open_ended'
                },
                {
                    'id': 'fun_3',
                    'text': 'Would you rather have a cozy night in or an adventurous night out?',
                    'category': 'fun',
                    'difficulty': 'easy',
                    'type': 'this_or_that',
                    'options': ['Cozy night in', 'Adventurous night out']
                }
            ],
            'deep': [
                {
                    'id': 'deep_1',
                    'text': 'What is one fear you have about our future together?',
                    'category': 'deep',
                    'difficulty': 'hard',
                    'type': 'open_ended'
                },
                {
                    'id': 'deep_2',
                    'text': 'What do you think is the most important quality in a relationship?',
                    'category': 'deep',
                    'difficulty': 'medium',
                    'type': 'open_ended'
                },
                {
                    'id': 'deep_3',
                    'text': 'How has our relationship changed you as a person?',
                    'category': 'deep',
                    'difficulty': 'hard',
                    'type': 'open_ended'
                }
            ],
            'memories': [
                {
                    'id': 'mem_1',
                    'text': 'What was your first impression of me?',
                    'category': 'memories',
                    'difficulty': 'easy',
                    'type': 'open_ended'
                },
                {
                    'id': 'mem_2',
                    'text': 'What is your favorite memory of us together?',
                    'category': 'memories',
                    'difficulty': 'easy',
                    'type': 'open_ended'
                },
                {
                    'id': 'mem_3',
                    'text': 'When did you first know you loved me?',
                    'category': 'memories',
                    'difficulty': 'medium',
                    'type': 'open_ended'
                }
            ]
        }
        
        self.category_weights = {
            'new_couples': {'fun': 0.3, 'communication': 0.25, 'memories': 0.2, 'intimacy': 0.15, 'deep': 0.1},
            'established_couples': {'deep': 0.25, 'communication': 0.25, 'intimacy': 0.2, 'fun': 0.15, 'memories': 0.15},
            'struggling_couples': {'communication': 0.4, 'deep': 0.25, 'intimacy': 0.2, 'fun': 0.1, 'memories': 0.05}
        }
    
    def recommend(self, user_id: str, answered_questions: List[str], 
                 preferences: Dict[str, Any] = None) -> QuestionRecommendationResponse:
        
        # Determine couple type based on answered questions and preferences
        couple_type = self._determine_couple_type(answered_questions, preferences or {})
        
        # Get category weights for this couple type
        weights = self.category_weights.get(couple_type, self.category_weights['established_couples'])
        
        # Filter out already answered questions
        available_questions = []
        for category, questions in self.question_bank.items():
            for question in questions:
                if question['id'] not in answered_questions:
                    available_questions.append(question)
        
        if not available_questions:
            # If all questions answered, recommend some again
            available_questions = [q for questions in self.question_bank.values() for q in questions]
        
        # Select questions based on weights and variety
        recommended = self._select_weighted_questions(available_questions, weights, count=5)
        
        # Generate reasoning
        reasoning = self._generate_reasoning(couple_type, recommended)
        
        return QuestionRecommendationResponse(
            recommended_questions=recommended,
            reasoning=reasoning
        )
    
    def _determine_couple_type(self, answered_questions: List[str], preferences: Dict[str, Any]) -> str:
        total_answered = len(answered_questions)
        
        # Simple heuristic based on number of questions answered
        if total_answered < 10:
            return 'new_couples'
        elif preferences.get('relationship_status') == 'struggling':
            return 'struggling_couples'
        else:
            return 'established_couples'
    
    def _select_weighted_questions(self, questions: List[Dict], weights: Dict[str, float], count: int) -> List[Dict]:
        # Group questions by category
        categorized = {}
        for question in questions:
            category = question['category']
            if category not in categorized:
                categorized[category] = []
            categorized[category].append(question)
        
        selected = []
        
        # Select questions based on weights
        for category, weight in sorted(weights.items(), key=lambda x: x[1], reverse=True):
            if category in categorized and len(selected) < count:
                # Number of questions to select from this category
                category_count = max(1, int(weight * count))
                category_questions = random.sample(
                    categorized[category], 
                    min(category_count, len(categorized[category]))
                )
                selected.extend(category_questions)
        
        # Fill remaining slots if needed
        while len(selected) < count and len(selected) < len(questions):
            remaining = [q for q in questions if q not in selected]
            if remaining:
                selected.append(random.choice(remaining))
            else:
                break
        
        return selected[:count]
    
    def _generate_reasoning(self, couple_type: str, questions: List[Dict]) -> List[str]:
        reasoning = []
        
        if couple_type == 'new_couples':
            reasoning.append("These questions are designed to help you get to know each other better")
            reasoning.append("Focus on fun and light topics to build comfort")
        elif couple_type == 'established_couples':
            reasoning.append("These questions will help deepen your existing connection")
            reasoning.append("Mix of meaningful and playful topics for balanced growth")
        elif couple_type == 'struggling_couples':
            reasoning.append("These questions focus on communication and understanding")
            reasoning.append("Designed to help rebuild connection and trust")
        
        # Add category-specific reasoning
        categories = set(q['category'] for q in questions)
        if 'communication' in categories:
            reasoning.append("Communication questions help improve understanding")
        if 'deep' in categories:
            reasoning.append("Deep questions foster emotional intimacy")
        if 'fun' in categories:
            reasoning.append("Fun questions keep the relationship playful and light")
        
        return reasoning
    
    def get_daily_question(self, preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get a single daily question based on preferences"""
        
        # Default to a mix of categories
        all_questions = [q for questions in self.question_bank.values() for q in questions]
        
        # Filter by difficulty if specified
        if preferences and 'difficulty' in preferences:
            difficulty = preferences['difficulty']
            filtered = [q for q in all_questions if q['difficulty'] == difficulty]
            if filtered:
                all_questions = filtered
        
        # Filter by category if specified
        if preferences and 'category' in preferences:
            category = preferences['category']
            if category in self.question_bank:
                all_questions = self.question_bank[category]
        
        return random.choice(all_questions) if all_questions else {}
    
    def adaptive_question_selection(self, user_performance: Dict[str, Any], 
                                  interaction_history: List[Dict]) -> List[Dict]:
        """Select questions based on user performance and engagement patterns"""
        
        # Analyze user engagement with different categories
        category_engagement = {}
        for interaction in interaction_history:
            category = interaction.get('category', 'unknown')
            engagement_score = interaction.get('engagement_score', 0.5)
            
            if category not in category_engagement:
                category_engagement[category] = []
            category_engagement[category].append(engagement_score)
        
        # Calculate average engagement per category
        avg_engagement = {}
        for category, scores in category_engagement.items():
            avg_engagement[category] = sum(scores) / len(scores) if scores else 0.5
        
        # Prioritize categories with higher engagement
        sorted_categories = sorted(avg_engagement.items(), key=lambda x: x[1], reverse=True)
        
        # Select questions from top engaging categories
        recommended = []
        for category, _ in sorted_categories[:3]:
            if category in self.question_bank:
                questions = self.question_bank[category]
                if questions:
                    recommended.append(random.choice(questions))
        
        return recommended