import random
from typing import Dict, List, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class QuestionGenerator:
    def __init__(self):
        self.question_templates = {
            'communication': [
                "What would you do if I {action}?",
                "How do you feel when we {situation}?",
                "What's your opinion on {topic}?",
                "If we disagreed about {subject}, how would you handle it?",
                "What does {concept} mean to you in our relationship?"
            ],
            'intimacy': [
                "What makes you feel most {emotion} with me?",
                "How do you prefer to show {feeling}?",
                "What's your favorite way to {activity} together?",
                "When do you feel most {state} in our relationship?",
                "What would make our {aspect} even better?"
            ],
            'fun': [
                "Would you rather {option1} or {option2}?",
                "What's your dream {experience} with me?",
                "If we could {activity}, where would you want to go?",
                "What's the most {adjective} thing we could do together?",
                "How would you spend a perfect {timeframe} with me?"
            ],
            'deep': [
                "What's your biggest {emotion} about our future?",
                "How has our relationship changed your {aspect}?",
                "What do you think is the most important {quality} in love?",
                "If you could change one thing about {subject}, what would it be?",
                "What does {concept} mean to you personally?"
            ],
            'memories': [
                "What's your favorite memory of us {activity}?",
                "When did you first realize you {feeling}?",
                "What moment made you feel most {emotion} about us?",
                "If you could relive one {timeframe} with me, which would it be?",
                "What's the {adjective} thing I've ever done for you?"
            ]
        }
        
        self.variable_pools = {
            'action': ['said something that hurt you', 'forgot an important date', 'surprised you', 'made a big decision without you'],
            'situation': ['have different opinions', 'spend time apart', 'face a challenge', 'celebrate together'],
            'topic': ['money management', 'family planning', 'career goals', 'lifestyle choices'],
            'subject': ['where to live', 'how to spend money', 'family time', 'career priorities'],
            'concept': ['trust', 'commitment', 'independence', 'partnership'],
            'emotion': ['loved', 'appreciated', 'understood', 'supported', 'valued'],
            'feeling': ['affection', 'gratitude', 'love', 'care', 'appreciation'],
            'activity': ['relax', 'have fun', 'be intimate', 'connect', 'bond'],
            'state': ['connected', 'secure', 'happy', 'peaceful', 'content'],
            'aspect': ['intimacy', 'communication', 'connection', 'bond', 'relationship'],
            'option1': ['stay home and cook', 'go on an adventure', 'have a quiet evening', 'try something new'],
            'option2': ['go out to dinner', 'relax at home', 'have an active day', 'stick to routine'],
            'experience': ['vacation', 'date night', 'weekend getaway', 'adventure', 'celebration'],
            'adjective': ['romantic', 'exciting', 'peaceful', 'adventurous', 'meaningful'],
            'timeframe': ['day', 'weekend', 'evening', 'week', 'month'],
            'quality': ['thing', 'value', 'trait', 'characteristic', 'aspect'],
            'fear': ['worry', 'concern', 'anxiety', 'doubt', 'uncertainty']
        }
        
        self.used_combinations = set()
    
    def generate_questions(self, user_profile: Dict, partner_profile: Dict, count: int = 5) -> List[Dict]:
        """Generate new questions based on user profiles"""
        questions = []
        
        # Determine preferred categories
        user_categories = self._get_preferred_categories(user_profile)
        partner_categories = self._get_preferred_categories(partner_profile)
        
        # Combine preferences
        combined_categories = list(set(user_categories + partner_categories))
        if not combined_categories:
            combined_categories = list(self.question_templates.keys())
        
        # Generate questions for each category
        for i in range(count):
            category = combined_categories[i % len(combined_categories)]
            question = self._generate_single_question(category, user_profile, partner_profile)
            if question:
                questions.append(question)
        
        return questions
    
    def _get_preferred_categories(self, profile: Dict) -> List[str]:
        """Extract preferred categories from user profile"""
        if not profile or 'preferred_categories' not in profile:
            return []
        
        categories = profile['preferred_categories']
        return sorted(categories.keys(), key=lambda x: categories[x], reverse=True)[:3]
    
    def _generate_single_question(self, category: str, user_profile: Dict, partner_profile: Dict) -> Dict:
        """Generate a single question for the category"""
        templates = self.question_templates.get(category, [])
        if not templates:
            return {}
        
        max_attempts = 10
        for _ in range(max_attempts):
            template = random.choice(templates)
            question_text = self._fill_template(template, user_profile, partner_profile)
            
            # Check if this combination was used recently
            combination_key = f"{category}_{template}_{hash(question_text)}"
            if combination_key not in self.used_combinations:
                self.used_combinations.add(combination_key)
                
                # Clean up old combinations (keep last 100)
                if len(self.used_combinations) > 100:
                    self.used_combinations = set(list(self.used_combinations)[-50:])
                
                return {
                    'id': f"gen_{combination_key}",
                    'text': question_text,
                    'category': category,
                    'type': self._determine_question_type(template),
                    'difficulty': self._determine_difficulty(user_profile, partner_profile),
                    'generated': True,
                    'template': template
                }
        
        # Fallback to basic question if generation fails
        return {
            'id': f"fallback_{category}_{random.randint(1000, 9999)}",
            'text': f"What's important to you about {category} in our relationship?",
            'category': category,
            'type': 'open_ended',
            'difficulty': 'medium',
            'generated': True
        }
    
    def _fill_template(self, template: str, user_profile: Dict, partner_profile: Dict) -> str:
        """Fill template with appropriate variables"""
        question_text = template
        
        # Find all variables in template
        import re
        variables = re.findall(r'\{(\w+)\}', template)
        
        for var in variables:
            if var in self.variable_pools:
                # Choose variable based on user preferences if available
                options = self.variable_pools[var]
                chosen = self._choose_contextual_option(var, options, user_profile, partner_profile)
                question_text = question_text.replace(f'{{{var}}}', chosen)
        
        return question_text
    
    def _choose_contextual_option(self, var_type: str, options: List[str], user_profile: Dict, partner_profile: Dict) -> str:
        """Choose option based on user context and preferences"""
        # For now, use random selection
        # Could be enhanced with ML to choose based on user history
        return random.choice(options)
    
    def _determine_question_type(self, template: str) -> str:
        """Determine question type based on template structure"""
        if 'would you rather' in template.lower() or ' or ' in template:
            return 'this_or_that'
        elif '?' in template and any(word in template.lower() for word in ['what', 'how', 'when', 'where', 'why']):
            return 'open_ended'
        else:
            return 'open_ended'
    
    def _determine_difficulty(self, user_profile: Dict, partner_profile: Dict) -> str:
        """Determine appropriate difficulty level"""
        if not user_profile or 'games_played' not in user_profile:
            return 'easy'
        
        games_played = user_profile.get('games_played', 0)
        avg_score = user_profile.get('avg_score', 0)
        
        if games_played < 3:
            return 'easy'
        elif games_played < 10 and avg_score > 0.7:
            return 'medium'
        elif avg_score > 0.8:
            return 'hard'
        else:
            return 'medium'
    
    def generate_follow_up_questions(self, previous_answers: List[Dict], count: int = 3) -> List[Dict]:
        """Generate follow-up questions based on previous answers"""
        follow_ups = []
        
        for i, answer_data in enumerate(previous_answers[-count:]):
            if 'answer' in answer_data and 'question' in answer_data:
                follow_up = self._create_follow_up(answer_data['question'], answer_data['answer'])
                if follow_up:
                    follow_ups.append(follow_up)
        
        return follow_ups
    
    def _create_follow_up(self, original_question: Dict, answer: str) -> Dict:
        """Create a follow-up question based on the original question and answer"""
        category = original_question.get('category', 'general')
        
        follow_up_templates = {
            'communication': [
                f"You mentioned '{answer[:30]}...' - can you tell me more about why that's important?",
                f"How would you help your partner understand your perspective on '{answer[:20]}...'?",
                f"What would you want me to know about your feelings regarding '{answer[:25]}...'?"
            ],
            'intimacy': [
                f"When you think about '{answer[:30]}...', what emotions come up?",
                f"How can we create more moments like what you described: '{answer[:25]}...'?",
                f"What would make the experience you mentioned even more meaningful?"
            ],
            'fun': [
                f"What excites you most about '{answer[:30]}...'?",
                f"How could we make '{answer[:25]}...' even more enjoyable together?",
                f"What other activities give you the same feeling as '{answer[:20]}...'?"
            ]
        }
        
        templates = follow_up_templates.get(category, follow_up_templates['communication'])
        question_text = random.choice(templates)
        
        return {
            'id': f"followup_{hash(question_text)}_{random.randint(100, 999)}",
            'text': question_text,
            'category': category,
            'type': 'open_ended',
            'difficulty': 'medium',
            'generated': True,
            'is_follow_up': True
        }
    
    def generate_contextual_questions(self, topics: List[str], sentiment: str, user_id: str, partner_id: str, count: int = 3) -> List[Dict]:
        """Generate questions based on conversation context"""
        contextual_templates = {
            'work': [
                "How do you balance work stress with our relationship?",
                "What support do you need from me regarding your career?",
                "How can we better support each other's professional goals?"
            ],
            'family': [
                "How do our families influence our relationship?",
                "What family traditions would you like us to create together?",
                "How can we navigate family expectations as a couple?"
            ],
            'future': [
                "What are you most excited about in our future together?",
                "How do you see us growing as a couple?",
                "What dreams do we share for our relationship?"
            ],
            'feelings': [
                "How can I better support you emotionally?",
                "What makes you feel most understood by me?",
                "How do you prefer to process difficult emotions together?"
            ],
            'activities': [
                "What new experiences would you like us to try together?",
                "How can we make our shared activities more meaningful?",
                "What activities bring out the best in our relationship?"
            ]
        }
        
        questions = []
        
        # Generate questions based on conversation topics
        for topic in topics[:count]:
            if topic in contextual_templates:
                template = random.choice(contextual_templates[topic])
                questions.append({
                    'id': f"contextual_{topic}_{random.randint(1000, 9999)}",
                    'text': template,
                    'category': topic,
                    'type': 'open_ended',
                    'difficulty': 'medium',
                    'generated': True,
                    'context_based': True
                })
        
        # Add sentiment-based questions
        if sentiment == 'negative' and len(questions) < count:
            questions.append({
                'id': f"sentiment_support_{random.randint(1000, 9999)}",
                'text': "What can we do to improve how we communicate during difficult conversations?",
                'category': 'communication',
                'type': 'open_ended',
                'difficulty': 'medium',
                'generated': True,
                'sentiment_based': True
            })
        
        return questions[:count]