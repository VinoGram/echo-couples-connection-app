from typing import Dict, List, Any
from datetime import datetime
import uuid

class GameResultsManager:
    def __init__(self):
        try:
            self.game_sessions = {}
            self.couple_results = {}
        except Exception as e:
            print(f"Error initializing GameResultsManager: {e}")
            self.game_sessions = {}
            self.couple_results = {}
    
    def create_game_session(self, couple_id: str, game_type: str, questions: List[Dict]) -> str:
        """Create new game session"""
        try:
            session_id = str(uuid.uuid4())
        except Exception:
            session_id = f"session_{datetime.utcnow().timestamp()}"
        
        self.game_sessions[session_id] = {
            'id': session_id,
            'couple_id': couple_id,
            'game_type': game_type,
            'questions': questions,
            'responses': {},
            'status': 'active',
            'created_at': datetime.utcnow().isoformat() + 'Z',
            'completed_at': None
        }
        
        return session_id
    
    def submit_response(self, session_id: str, user_id: str, question_id: str, response: Any) -> bool:
        """Submit user response to question"""
        try:
            if session_id not in self.game_sessions:
                return False
            
            session = self.game_sessions[session_id]
        except Exception:
            return False
        
        if user_id not in session['responses']:
            session['responses'][user_id] = {}
        
        session['responses'][user_id][question_id] = {
            'answer': response,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        
        return True
    
    def complete_game_session(self, session_id: str) -> Dict[str, Any]:
        """Complete game session and generate results"""
        try:
            if session_id not in self.game_sessions:
                return {}
        except Exception:
            return {}
        
        session = self.game_sessions[session_id]
        session['status'] = 'completed'
        session['completed_at'] = datetime.utcnow().isoformat() + 'Z'
        
        # Generate comparison results
        results = self._generate_comparison_results(session)
        
        # Store results for couple
        couple_id = session['couple_id']
        if couple_id not in self.couple_results:
            self.couple_results[couple_id] = []
        
        self.couple_results[couple_id].append({
            'session_id': session_id,
            'game_type': session['game_type'],
            'results': results,
            'completed_at': session['completed_at']
        })
        
        return results
    
    def _generate_comparison_results(self, session: Dict) -> Dict[str, Any]:
        """Generate comparison results between partners"""
        questions = session['questions']
        responses = session['responses']
        
        user_ids = list(responses.keys())
        if len(user_ids) != 2:
            return {'error': 'Need exactly 2 participants'}
        
        user1_id, user2_id = user_ids
        # Cache responses for performance
        user1_responses = responses.get(user1_id, {})
        user2_responses = responses.get(user2_id, {})
        
        comparisons = []
        matches = 0
        total_questions = len(questions)
        
        for question in questions:
            question_id = question['id']
            
            user1_answer = user1_responses.get(question_id, {}).get('answer')
            user2_answer = user2_responses.get(question_id, {}).get('answer')
            
            if user1_answer is None or user2_answer is None:
                continue
            
            is_match = self._compare_answers(user1_answer, user2_answer, question['type'])
            if is_match:
                matches += 1
            
            comparisons.append({
                'question': question,
                'user1_answer': user1_answer,
                'user2_answer': user2_answer,
                'match': is_match,
                'similarity_score': self._calculate_similarity(user1_answer, user2_answer, question['type'])
            })
        
        compatibility_score = matches / total_questions if total_questions > 0 else 0
        
        return {
            'session_id': session['id'],
            'game_type': session['game_type'],
            'participants': {
                user1_id: {'responses': user1_responses},
                user2_id: {'responses': user2_responses}
            },
            'comparisons': comparisons,
            'summary': {
                'total_questions': total_questions,
                'matches': matches,
                'compatibility_score': round(compatibility_score, 2),
                'insights': self._generate_insights(comparisons, compatibility_score)
            }
        }
    
    def _compare_answers(self, answer1: Any, answer2: Any, question_type: str) -> bool:
        """Compare two answers based on question type"""
        if question_type in ['multiple_choice', 'this_or_that']:
            return str(answer1).lower() == str(answer2).lower()
        elif question_type == 'true_false':
            return bool(answer1) == bool(answer2)
        elif question_type == 'open_ended':
            # Simple text similarity for open-ended
            return self._text_similarity(str(answer1), str(answer2)) > 0.7
        else:
            return str(answer1).lower() == str(answer2).lower()
    
    def _calculate_similarity(self, answer1: Any, answer2: Any, question_type: str) -> float:
        """Calculate similarity score between answers"""
        if question_type in ['multiple_choice', 'this_or_that', 'true_false']:
            return 1.0 if self._compare_answers(answer1, answer2, question_type) else 0.0
        elif question_type == 'open_ended':
            return self._text_similarity(str(answer1), str(answer2))
        else:
            return 1.0 if str(answer1).lower() == str(answer2).lower() else 0.0
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """Calculate text similarity using Jaccard similarity"""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 and not words2:
            return 1.0
        if not words1 or not words2:
            return 0.0
        
        # Use Jaccard similarity for better performance
        intersection_size = len(words1 & words2)
        union_size = len(words1 | words2)
        
        return intersection_size / union_size if union_size > 0 else 0.0
    
    def _generate_insights(self, comparisons: List[Dict], compatibility_score: float) -> List[str]:
        """Generate insights from comparison results"""
        insights = []
        
        # Add overall compatibility message
        insights.append(self._get_compatibility_message(compatibility_score))
        
        # Category-specific insights
        category_matches = self._calculate_category_matches(comparisons)
        
        for category, stats in category_matches.items():
            if stats['total'] > 0:
                category_score = stats['matches'] / stats['total']
                if category_score > 0.8:
                    insights.append(f"You're very aligned on {category} topics!")
                elif category_score < 0.3:
                    insights.append(f"You have different perspectives on {category} - discuss these!")
        
        return insights
    
    def _get_compatibility_message(self, score: float) -> str:
        """Get compatibility message based on score"""
        if score > 0.8:
            return "You have excellent compatibility! You think very similarly."
        elif score > 0.6:
            return "You have good compatibility with some interesting differences."
        elif score > 0.4:
            return "You have moderate compatibility. Your differences can be strengths!"
        else:
            return "You have many differences - great opportunity to learn from each other!"
    
    def _calculate_category_matches(self, comparisons: List[Dict]) -> Dict[str, Dict[str, int]]:
        """Calculate matches by category for performance"""
        category_matches = {}
        for comp in comparisons:
            category = comp['question'].get('category', 'general')
            if category not in category_matches:
                category_matches[category] = {'matches': 0, 'total': 0}
            
            category_matches[category]['total'] += 1
            if comp['match']:
                category_matches[category]['matches'] += 1
        
        return category_matches
    
    def get_couple_history(self, couple_id: str) -> List[Dict]:
        """Get game history for couple"""
        return self.couple_results.get(couple_id, [])
    
    def get_session_results(self, session_id: str) -> Dict[str, Any]:
        """Get results for specific session"""
        for couple_id, results in self.couple_results.items():
            for result in results:
                if result['session_id'] == session_id:
                    return result
        return {}
    
    def can_replay_game(self, couple_id: str, game_type: str) -> bool:
        """Check if couple can replay a game type"""
        history = self.get_couple_history(couple_id)
        
        # Allow replay if no games played or last game was more than 1 hour ago
        recent_games = [
            game for game in history 
            if game['game_type'] == game_type
        ]
        
        if not recent_games:
            return True
        
        # For now, always allow replay (can add cooldown logic here)
        return True