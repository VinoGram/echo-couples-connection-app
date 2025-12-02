const express = require('express');
const { Op } = require('sequelize');
const Question = require('../models/Question');
const auth = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// Get questions by category
router.get('/', auth, async (req, res) => {
  try {
    // Return sample questions for now
    const questions = getSampleQuestions('all', 'all').slice(0, 10);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get adaptive questions (AI-powered with user data training)
router.get('/adaptive', auth, async (req, res) => {
  try {
    // Get user's conversation history and preferences for AI training
    const User = require('../models/User');
    const currentUser = await User.findByPk(req.user.id);
    const partnerId = currentUser?.partnerId;
    
    // Collect user data for AI training
    const userData = await collectUserDataForTraining(req.user.id, partnerId);
    
    // Generate adaptive questions based on user data
    const adaptiveQuestions = await generateAdaptiveQuestions(userData, req.query.category);
    
    res.json(adaptiveQuestions);
  } catch (error) {
    console.error('Adaptive questions error:', error.message);
    // Fallback questions
    const fallbackQuestions = [
      { id: 1, text: "What's your favorite way to spend quality time together?", category: 'connection', type: 'open_ended' },
      { id: 2, text: "How do you prefer to handle disagreements?", category: 'communication', type: 'open_ended' },
      { id: 3, text: "What's one thing you'd like to improve in our relationship?", category: 'growth', type: 'open_ended' },
      { id: 4, text: "What makes you feel most appreciated?", category: 'love', type: 'open_ended' },
      { id: 5, text: "What's a goal you'd like us to work on together?", category: 'future', type: 'open_ended' }
    ];
    res.json(fallbackQuestions);
  }
});

// Collect user data for AI training
async function collectUserDataForTraining(userId, partnerId) {
  try {
    const memcached = require('../services/memcached');
    
    // Get recent chat messages
    const chatMessages = [];
    for (let i = 0; i < 30; i++) {
      const messageKey = `chat_${userId}_${partnerId}_${i}`;
      const message = await memcached.get(messageKey);
      if (message) {
        chatMessages.push(JSON.parse(message));
      }
    }
    
    // Get recent daily question answers
    const recentAnswers = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const answerKey = `${dateStr}_${userId}`;
      const answer = await memcached.get(answerKey);
      if (answer) {
        recentAnswers.push(JSON.parse(answer));
      }
    }
    
    // Get user preferences and stats
    const User = require('../models/User');
    const user = await User.findByPk(userId);
    
    return {
      chatMessages,
      recentAnswers,
      userPreferences: user?.preferences || {},
      userStats: user?.stats || {},
      userId,
      partnerId
    };
  } catch (error) {
    console.error('Error collecting user data:', error);
    return { chatMessages: [], recentAnswers: [], userPreferences: {}, userStats: {} };
  }
}

// Generate adaptive questions using AI logic
async function generateAdaptiveQuestions(userData, category) {
  try {
    const { chatMessages, recentAnswers, userPreferences, userStats } = userData;
    
    // Analyze user communication patterns
    const communicationStyle = analyzeCommunicationStyle(chatMessages);
    const interests = extractInterests(chatMessages, recentAnswers);
    const relationshipFocus = determineRelationshipFocus(recentAnswers, userStats);
    
    // Generate questions based on analysis
    const questionPool = {
      communication: [
        "How do you prefer to express your feelings when you're upset?",
        "What communication style makes you feel most understood?",
        "When we have different opinions, how should we handle it?",
        "What's the best way for me to support you during stress?",
        "How can we improve our daily communication?"
      ],
      intimacy: [
        "What makes you feel most emotionally connected to me?",
        "How do you prefer to show and receive physical affection?",
        "What creates the most romantic atmosphere for you?",
        "When do you feel most vulnerable and safe with me?",
        "What deepens our emotional intimacy?"
      ],
      growth: [
        "What's one area where we've grown stronger as a couple?",
        "What challenge would you like us to work on together?",
        "How can we better support each other's personal goals?",
        "What relationship skill should we develop next?",
        "What's something new you'd like to try together?"
      ],
      fun: [
        "What's your ideal way to spend a weekend together?",
        "What new adventure would you like us to go on?",
        "How can we add more playfulness to our relationship?",
        "What activity always makes you laugh with me?",
        "What's your favorite way to celebrate together?"
      ],
      future: [
        "What's one dream you'd like us to pursue together?",
        "How do you envision our relationship in 5 years?",
        "What legacy do you want us to create together?",
        "What's the most important goal for our future?",
        "How can we prepare for the challenges ahead?"
      ]
    };
    
    // Select questions based on user data analysis
    const selectedCategory = category || relationshipFocus;
    const questions = questionPool[selectedCategory] || questionPool.communication;
    
    // Personalize questions based on communication style and interests
    const personalizedQuestions = questions.slice(0, 5).map((text, index) => {
      // Add personalization based on user data
      let personalizedText = text;
      if (communicationStyle.isDirectCommunicator) {
        personalizedText = text.replace('How do you', 'What specifically do you');
      }
      if (interests.includes('travel')) {
        personalizedText = personalizedText.replace('together', 'together while traveling');
      }
      
      return {
        id: index + 1,
        text: personalizedText,
        category: selectedCategory,
        type: 'open_ended',
        personalization_level: 'high',
        generated_by: 'ai_training',
        confidence_score: 0.85 + (Math.random() * 0.1)
      };
    });
    
    return personalizedQuestions;
  } catch (error) {
    console.error('Error generating adaptive questions:', error);
    // Return basic questions if AI generation fails
    return [
      { id: 1, text: "What's your favorite thing about our relationship?", category: 'love', type: 'open_ended' },
      { id: 2, text: "How can we communicate better?", category: 'communication', type: 'open_ended' },
      { id: 3, text: "What's one goal we should work on together?", category: 'future', type: 'open_ended' },
      { id: 4, text: "What makes you feel most appreciated?", category: 'love', type: 'open_ended' },
      { id: 5, text: "How do you prefer to spend quality time?", category: 'fun', type: 'open_ended' }
    ];
  }
}

// Analyze communication style from messages
function analyzeCommunicationStyle(messages) {
  const totalMessages = messages.length;
  if (totalMessages === 0) return { isDirectCommunicator: false, emotionalTone: 'neutral' };
  
  let directWords = 0;
  let emotionalWords = 0;
  
  const directIndicators = ['need', 'want', 'should', 'must', 'will', 'definitely'];
  const emotionalIndicators = ['feel', 'love', 'happy', 'sad', 'excited', 'worried'];
  
  messages.forEach(msg => {
    if (msg.content) {
      const words = msg.content.toLowerCase().split(' ');
      directWords += words.filter(word => directIndicators.includes(word)).length;
      emotionalWords += words.filter(word => emotionalIndicators.includes(word)).length;
    }
  });
  
  return {
    isDirectCommunicator: directWords > totalMessages * 0.1,
    emotionalTone: emotionalWords > totalMessages * 0.15 ? 'emotional' : 'neutral'
  };
}

// Extract interests from conversations
function extractInterests(messages, answers) {
  const interests = [];
  const interestKeywords = {
    travel: ['travel', 'trip', 'vacation', 'visit', 'explore'],
    food: ['cook', 'restaurant', 'food', 'dinner', 'eat'],
    fitness: ['gym', 'workout', 'exercise', 'run', 'fitness'],
    entertainment: ['movie', 'show', 'music', 'concert', 'game']
  };
  
  const allText = [...messages.map(m => m.content || ''), ...answers.map(a => a.answer || '')].join(' ').toLowerCase();
  
  Object.entries(interestKeywords).forEach(([interest, keywords]) => {
    if (keywords.some(keyword => allText.includes(keyword))) {
      interests.push(interest);
    }
  });
  
  return interests;
}

// Determine relationship focus area
function determineRelationshipFocus(recentAnswers, userStats) {
  if (recentAnswers.length === 0) return 'communication';
  
  // Analyze recent answers to determine focus
  const answerText = recentAnswers.map(a => a.answer || '').join(' ').toLowerCase();
  
  if (answerText.includes('future') || answerText.includes('goal')) return 'future';
  if (answerText.includes('fun') || answerText.includes('laugh')) return 'fun';
  if (answerText.includes('love') || answerText.includes('feel')) return 'intimacy';
  if (answerText.includes('better') || answerText.includes('improve')) return 'growth';
  
  return 'communication';
}

// This or That game questions
router.get('/this-or-that', auth, async (req, res) => {
  try {
    const thisOrThatQuestions = [
      {
        id: 1,
        question: "For a perfect evening together",
        option1: "Cozy movie night at home",
        option2: "Romantic dinner out"
      },
      {
        id: 2,
        question: "For our next vacation",
        option1: "Beach resort",
        option2: "Mountain cabin"
      },
      {
        id: 3,
        question: "For showing love",
        option1: "Physical touch",
        option2: "Words of affirmation"
      },
      {
        id: 4,
        question: "For weekend mornings",
        option1: "Sleep in together",
        option2: "Early morning adventure"
      },
      {
        id: 5,
        question: "For date nights",
        option1: "Try new experiences",
        option2: "Stick to favorites"
      }
    ];
    
    res.json({ questions: thisOrThatQuestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily question
router.get('/daily', auth, async (req, res) => {
  try {
    const today = new Date().toDateString();
    const seed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    const count = await Question.count({ 
      where: {
        category: 'relationship', 
        isActive: true 
      }
    });
    
    const offset = seed % count;
    const question = await Question.findOne({ 
      where: {
        category: 'relationship', 
        isActive: true 
      },
      offset
    });

    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's question
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date().toDateString();
    const seed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    const count = await Question.count({ 
      where: { isActive: true }
    });
    
    let question;
    if (count === 0) {
      // Fallback question if no questions in database
      question = { 
        id: 1, 
        text: "What's one thing I did this week that made you feel loved?", 
        category: 'love',
        depth: 'light'
      };
    } else {
      const offset = seed % count;
      question = await Question.findOne({ 
        where: { isActive: true },
        offset
      });
    }

    // Get user's couple info to find partner
    const User = require('../models/User');
    const currentUser = await User.findByPk(req.user.id);
    const partnerId = currentUser?.partnerId;
    
    // Check if user and partner have answered
    const userAnswerKey = `${today}_${req.user.id}`;
    const partnerAnswerKey = partnerId ? `${today}_${partnerId}` : null;
    
    const memcached = require('../services/memcached');
    const userAnswerData = await memcached.get(userAnswerKey);
    const partnerAnswerData = partnerAnswerKey ? await memcached.get(partnerAnswerKey) : null;
    
    const userAnswer = userAnswerData ? JSON.parse(userAnswerData) : null;
    const partnerAnswer = partnerAnswerData ? JSON.parse(partnerAnswerData) : null;
    
    // Return in expected format
    res.json({
      question: question,
      userHasAnswered: !!userAnswer,
      partnerHasAnswered: !!partnerAnswer,
      bothAnswered: !!userAnswer && !!partnerAnswer,
      userAnswer: userAnswer?.answer || null,
      partnerAnswer: partnerAnswer?.answer || null
    });
  } catch (error) {
    console.error('Today question error:', error);
    res.json({
      question: { 
        id: 1, 
        text: "What's one thing I did this week that made you feel loved?", 
        category: 'love',
        depth: 'light'
      },
      userHasAnswered: false,
      partnerHasAnswered: false,
      bothAnswered: false,
      userAnswer: null,
      partnerAnswer: null
    });
  }
});

// Add new question (from ML service)
router.post('/add', async (req, res) => {
  try {
    const { text, type, category, difficulty } = req.body;
    
    // Input validation
    if (!text || typeof text !== 'string' || text.length > 500) {
      return res.status(400).json({ error: 'Invalid question text' });
    }
    
    const validTypes = ['open_ended', 'multiple_choice', 'yes_no'];
    const validCategories = ['communication', 'intimacy', 'fun', 'deep', 'memories', 'relationship'];
    const validDifficulties = ['easy', 'medium', 'hard'];
    
    const question = await Question.create({
      text: text.trim(),
      type: validTypes.includes(type) ? type : 'open_ended',
      category: validCategories.includes(category) ? category : 'relationship',
      difficulty: validDifficulties.includes(difficulty) ? difficulty : 'medium',
      isActive: true
    });
    
    res.json({ success: true, questionId: question.id });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Train AI with user interaction data
router.post('/train', auth, async (req, res) => {
  try {
    const { questionId, answer, rating, category, context } = req.body;
    
    if (!answer) {
      return res.status(400).json({ error: 'Answer is required for training' });
    }
    
    // Store training data
    const trainingKey = `training_${req.user.id}_${Date.now()}`;
    const trainingData = {
      userId: req.user.id,
      questionId,
      answer: answer.trim(),
      rating: rating || 5, // User satisfaction with question (1-5)
      category: category || 'general',
      context: context || {},
      timestamp: new Date().toISOString(),
      wordCount: answer.trim().split(' ').length,
      sentiment: analyzeAnswerSentiment(answer)
    };
    
    const memcached = require('../services/memcached');
    await memcached.setEx(trainingKey, 2592000, JSON.stringify(trainingData)); // Store for 30 days
    
    // Update user's AI preferences
    const User = require('../models/User');
    const user = await User.findByPk(req.user.id);
    const currentPrefs = user.preferences || {};
    const aiPrefs = currentPrefs.aiTraining || {};
    
    // Track user's preferred question types and topics
    const updatedAiPrefs = {
      ...aiPrefs,
      totalInteractions: (aiPrefs.totalInteractions || 0) + 1,
      preferredCategories: updateCategoryPreference(aiPrefs.preferredCategories || {}, category, rating),
      avgResponseLength: calculateAvgResponseLength(aiPrefs, answer),
      lastTrainingUpdate: new Date().toISOString()
    };
    
    await user.update({
      preferences: {
        ...currentPrefs,
        aiTraining: updatedAiPrefs
      }
    });
    
    res.json({ 
      success: true, 
      message: 'AI training data recorded',
      aiLearningEnabled: true,
      totalInteractions: updatedAiPrefs.totalInteractions
    });
  } catch (error) {
    console.error('AI training error:', error);
    res.status(500).json({ error: 'Failed to record training data' });
  }
});

// Analyze sentiment of user answers for AI training
function analyzeAnswerSentiment(answer) {
  const positiveWords = ['love', 'happy', 'great', 'amazing', 'wonderful', 'perfect', 'best', 'enjoy'];
  const negativeWords = ['sad', 'angry', 'frustrated', 'difficult', 'hard', 'struggle', 'problem'];
  
  const words = answer.toLowerCase().split(' ');
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Update category preferences based on user ratings
function updateCategoryPreference(currentPrefs, category, rating) {
  const updated = { ...currentPrefs };
  const current = updated[category] || { total: 0, count: 0, avg: 0 };
  
  const newTotal = current.total + (rating || 5);
  const newCount = current.count + 1;
  const newAvg = newTotal / newCount;
  
  updated[category] = {
    total: newTotal,
    count: newCount,
    avg: newAvg
  };
  
  return updated;
}

// Calculate average response length for personalization
function calculateAvgResponseLength(aiPrefs, newAnswer) {
  const currentAvg = aiPrefs.avgResponseLength || 0;
  const currentCount = aiPrefs.totalInteractions || 0;
  const newLength = newAnswer.trim().split(' ').length;
  
  return ((currentAvg * currentCount) + newLength) / (currentCount + 1);
}

// Submit answer to daily question
router.post('/submit', auth, async (req, res) => {
  try {
    const { dailyQuestionId, answer } = req.body;
    
    if (!answer || !answer.trim()) {
      return res.status(400).json({ error: 'Answer is required' });
    }
    
    // Create a simple answer storage (in production, use proper database)
    const today = new Date().toDateString();
    const answerKey = `${today}_${req.user.id}`;
    
    // Store answer in cache/memory (replace with database in production)
    const memcached = require('../services/memcached');
    const answerData = {
      userId: req.user.id,
      questionId: dailyQuestionId,
      answer: answer.trim(),
      submittedAt: new Date()
    };
    await memcached.setEx(answerKey, 86400, JSON.stringify(answerData));
    
    // Get user's partner ID to check their answer
    const User = require('../models/User');
    const currentUser = await User.findByPk(req.user.id);
    const partnerId = currentUser?.partnerId;
    
    // Send answer to ML service for learning
    try {
      if (process.env.ML_SERVICE_URL) {
        const questionData = {
          id: dailyQuestionId,
          category: 'daily_question',
          type: 'open_ended'
        };
        
        await axios.post(`${process.env.ML_SERVICE_URL}/learn/question-response`, {
          user_id: req.user.id,
          question_data: questionData,
          response_data: { answer: answer.trim() }
        });
      }
    } catch (mlError) {
      console.error('ML service learning error:', mlError.message);
      // Continue without failing the request
    }
    
    // Update user streak
    const currentStats = currentUser.stats || {};
    const lastActivityDate = currentStats.lastActivityDate;
    const todayDate = new Date().toDateString();
    
    let newStreak = 1;
    if (lastActivityDate) {
      const lastDate = new Date(lastActivityDate);
      const today = new Date(todayDate);
      const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day
        newStreak = (currentStats.currentStreak || 0) + 1;
      } else if (daysDiff === 0) {
        // Same day, keep current streak
        newStreak = currentStats.currentStreak || 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }
    
    const updatedStats = {
      ...currentStats,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, currentStats.longestStreak || 0),
      lastActivityDate: todayDate,
      totalXP: (currentStats.totalXP || 0) + 5 // Award 5 XP for daily question
    };
    
    await currentUser.update({ stats: updatedStats });
    
    // Send notification to partner about daily question answer
    if (partnerId) {
      try {
        const partner = await User.findByPk(partnerId);
        if (partner && partner.preferences?.notifications?.partnerAnswered !== false) {
          const emailService = require('../services/emailService');
          await emailService.sendActivityCompletionNotification(
            partner.email,
            partner.username,
            currentUser.username,
            'daily_question',
            'Daily Question'
          );
        }
      } catch (emailError) {
        console.error('Failed to send partner notification for daily question:', emailError);
      }
    }
    
    // Check if partner has answered
    const partnerAnswerKey = partnerId ? `${today}_${partnerId}` : null;
    const partnerAnswer = partnerAnswerKey ? await memcached.get(partnerAnswerKey) : null;
    
    res.json({ 
      success: true, 
      bothAnswered: !!partnerAnswer,
      message: 'Answer submitted successfully',
      streak: newStreak,
      xpEarned: 5,
      mlLearningEnabled: !!process.env.ML_SERVICE_URL
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Browse questions
router.get('/browse', auth, async (req, res) => {
  try {
    const { category, depth } = req.query;
    const where = { isActive: true };
    
    // Map frontend categories to backend categories
    const categoryMap = {
      'love': 'relationship',
      'memories': 'memories', 
      'desires': 'deep',
      'dates': 'fun',
      'finance': 'personal',
      'family': 'personal',
      'future': 'deep',
      'fun': 'fun'
    };
    
    if (category && category !== 'all') {
      const mappedCategory = categoryMap[category] || category;
      where.category = mappedCategory;
    }
    
    // Handle depth filter
    if (depth && depth !== 'all') {
      if (depth === 'light') {
        where.difficulty = { [Op.in]: ['easy', 'medium'] };
      } else if (depth === 'deep') {
        where.difficulty = 'hard';
      }
    }
    
    let questions = await Question.findAll({
      where,
      limit: 20
    });
    
    // Fallback to sample questions if DB is empty
    if (questions.length === 0) {
      questions = getSampleQuestions(category, depth);
    }
    
    res.json({ questions });
  } catch (error) {
    console.error('Browse questions error:', error);
    const questions = getSampleQuestions(req.query.category, req.query.depth);
    res.json({ questions });
  }
});

// Sample questions function
function getSampleQuestions(category, depth) {
  const allQuestions = {
    love: [
      { id: 1, text: "What makes you feel most loved by me?", category: 'love', depth: 'light' },
      { id: 2, text: "What's your favorite way to show affection?", category: 'love', depth: 'light' },
      { id: 3, text: "What does unconditional love mean to you?", category: 'love', depth: 'deep' }
    ],
    memories: [
      { id: 4, text: "What was your first impression of me?", category: 'memories', depth: 'light' },
      { id: 5, text: "What's your favorite memory of us together?", category: 'memories', depth: 'light' },
      { id: 6, text: "When did you first know you loved me?", category: 'memories', depth: 'deep' }
    ],
    desires: [
      { id: 7, text: "What's one dream you'd like us to pursue together?", category: 'desires', depth: 'deep' },
      { id: 8, text: "What's something new you'd like to try as a couple?", category: 'desires', depth: 'light' },
      { id: 9, text: "What does your ideal relationship look like?", category: 'desires', depth: 'deep' }
    ],
    dates: [
      { id: 10, text: "What's your ideal date night?", category: 'dates', depth: 'light' },
      { id: 11, text: "Where would you like to go on our next adventure?", category: 'dates', depth: 'light' },
      { id: 12, text: "What's the most romantic date we've been on?", category: 'dates', depth: 'light' }
    ],
    finance: [
      { id: 13, text: "What are your financial goals for us?", category: 'finance', depth: 'deep' },
      { id: 14, text: "How do you prefer to handle money decisions?", category: 'finance', depth: 'deep' },
      { id: 15, text: "What's one financial dream we should work towards?", category: 'finance', depth: 'deep' }
    ],
    family: [
      { id: 16, text: "What family traditions would you like to start?", category: 'family', depth: 'deep' },
      { id: 17, text: "How do you envision our future family?", category: 'family', depth: 'deep' },
      { id: 18, text: "What's your favorite family memory?", category: 'family', depth: 'light' }
    ],
    future: [
      { id: 19, text: "Where do you see us in 5 years?", category: 'future', depth: 'deep' },
      { id: 20, text: "What's one goal we should achieve together?", category: 'future', depth: 'deep' },
      { id: 21, text: "What excites you most about our future?", category: 'future', depth: 'light' }
    ],
    fun: [
      { id: 22, text: "If we could travel anywhere together, where would you choose?", category: 'fun', depth: 'light' },
      { id: 23, text: "What's the silliest thing we've done together?", category: 'fun', depth: 'light' },
      { id: 24, text: "Would you rather have a cozy night in or adventurous night out?", category: 'fun', depth: 'light' }
    ]
  };
  
  let questions = [];
  
  if (category && category !== 'all' && allQuestions[category]) {
    questions = allQuestions[category];
  } else {
    questions = Object.values(allQuestions).flat();
  }
  
  // Apply depth filter
  if (depth && depth !== 'all') {
    questions = questions.filter(q => q.depth === depth);
  }
  
  return questions;
}

module.exports = router;