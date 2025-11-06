import re
from typing import Dict, List
from .models import SentimentResponse

class SentimentAnalyzer:
    def __init__(self):
        # Simple sentiment lexicon for relationship context
        self.positive_words = {
            'love', 'happy', 'joy', 'amazing', 'wonderful', 'great', 'fantastic',
            'excited', 'grateful', 'blessed', 'perfect', 'beautiful', 'awesome',
            'incredible', 'thrilled', 'delighted', 'content', 'peaceful', 'warm',
            'caring', 'supportive', 'understanding', 'romantic', 'sweet', 'kind'
        }
        
        self.negative_words = {
            'sad', 'angry', 'frustrated', 'disappointed', 'hurt', 'upset', 'mad',
            'annoyed', 'worried', 'stressed', 'anxious', 'confused', 'lonely',
            'tired', 'exhausted', 'overwhelmed', 'distant', 'cold', 'harsh',
            'critical', 'judgmental', 'impatient', 'selfish', 'rude', 'mean'
        }
        
        self.emotion_keywords = {
            'joy': ['happy', 'joyful', 'excited', 'thrilled', 'delighted', 'elated'],
            'love': ['love', 'adore', 'cherish', 'treasure', 'romantic', 'affection'],
            'gratitude': ['grateful', 'thankful', 'blessed', 'appreciate', 'lucky'],
            'sadness': ['sad', 'disappointed', 'hurt', 'lonely', 'melancholy'],
            'anger': ['angry', 'mad', 'frustrated', 'annoyed', 'irritated', 'furious'],
            'anxiety': ['worried', 'anxious', 'nervous', 'stressed', 'concerned', 'tense'],
            'surprise': ['surprised', 'shocked', 'amazed', 'astonished', 'stunned'],
            'trust': ['trust', 'secure', 'safe', 'confident', 'reliable', 'dependable']
        }
    
    def analyze(self, text: str) -> SentimentResponse:
        # Clean and tokenize text
        words = self._tokenize(text.lower())
        
        # Calculate sentiment scores
        positive_score = sum(1 for word in words if word in self.positive_words)
        negative_score = sum(1 for word in words if word in self.negative_words)
        
        total_sentiment_words = positive_score + negative_score
        
        if total_sentiment_words == 0:
            sentiment = 'neutral'
            confidence = 0.5
        else:
            sentiment_score = (positive_score - negative_score) / len(words)
            
            if sentiment_score > 0.1:
                sentiment = 'positive'
                confidence = min(0.9, 0.5 + abs(sentiment_score) * 2)
            elif sentiment_score < -0.1:
                sentiment = 'negative'
                confidence = min(0.9, 0.5 + abs(sentiment_score) * 2)
            else:
                sentiment = 'neutral'
                confidence = 0.6
        
        # Analyze emotions
        emotions = self._analyze_emotions(words)
        
        return SentimentResponse(
            sentiment=sentiment,
            confidence=round(confidence, 2),
            emotions=emotions
        )
    
    def _tokenize(self, text: str) -> List[str]:
        # Simple tokenization
        text = re.sub(r'[^\w\s]', '', text)
        return text.split()
    
    def _analyze_emotions(self, words: List[str]) -> Dict[str, float]:
        emotions = {}
        
        for emotion, keywords in self.emotion_keywords.items():
            score = sum(1 for word in words if word in keywords)
            emotions[emotion] = round(score / max(len(words), 1), 2)
        
        return emotions
    
    def analyze_relationship_communication(self, messages: List[str]) -> Dict[str, any]:
        """Analyze communication patterns in relationship messages"""
        total_messages = len(messages)
        
        if total_messages == 0:
            return {
                'overall_sentiment': 'neutral',
                'communication_health': 0.5,
                'emotional_balance': 0.5,
                'suggestions': ['Start communicating more to get insights']
            }
        
        # Analyze each message
        sentiments = []
        all_emotions = {'joy': 0, 'love': 0, 'gratitude': 0, 'sadness': 0, 'anger': 0, 'anxiety': 0}
        
        for message in messages:
            analysis = self.analyze(message)
            sentiments.append(analysis.sentiment)
            
            for emotion, score in analysis.emotions.items():
                if emotion in all_emotions:
                    all_emotions[emotion] += score
        
        # Calculate overall metrics
        positive_ratio = sentiments.count('positive') / total_messages
        negative_ratio = sentiments.count('negative') / total_messages
        
        overall_sentiment = 'positive' if positive_ratio > 0.5 else 'negative' if negative_ratio > 0.3 else 'neutral'
        communication_health = max(0, min(1, positive_ratio - negative_ratio * 0.5 + 0.5))
        
        # Emotional balance (prefer positive emotions but some variety is healthy)
        positive_emotions = all_emotions['joy'] + all_emotions['love'] + all_emotions['gratitude']
        negative_emotions = all_emotions['sadness'] + all_emotions['anger'] + all_emotions['anxiety']
        
        if positive_emotions + negative_emotions > 0:
            emotional_balance = positive_emotions / (positive_emotions + negative_emotions)
        else:
            emotional_balance = 0.5
        
        # Generate suggestions
        suggestions = []
        if communication_health < 0.6:
            suggestions.append('Focus on more positive communication')
        if all_emotions['gratitude'] < 0.1:
            suggestions.append('Express more gratitude and appreciation')
        if all_emotions['love'] < 0.1:
            suggestions.append('Share more loving and affectionate messages')
        
        return {
            'overall_sentiment': overall_sentiment,
            'communication_health': round(communication_health, 2),
            'emotional_balance': round(emotional_balance, 2),
            'emotion_breakdown': all_emotions,
            'suggestions': suggestions
        }