const express = require('express');
const { Op } = require('sequelize');
const Question = require('../models/Question');
const auth = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// Get questions by category
router.get('/', auth, async (req, res) => {
  try {
    const { category, difficulty, limit = 10 } = req.query;
    
    const where = { isActive: true };
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;

    const questions = await Question.findAll({ 
      where,
      limit: Math.min(parseInt(limit) || 10, 100)
    });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get adaptive questions (calls ML service)
router.get('/adaptive', auth, async (req, res) => {
  try {
    if (!process.env.ML_SERVICE_URL) {
      throw new Error('ML service not configured');
    }
    
    const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/questions/adaptive`, {
      user_id: req.user.id,
      partner_id: req.query.partnerId || 'unknown',
      category: req.query.category,
      count: 5
    });

    res.json(mlResponse.data.questions);
  } catch (error) {
    console.error('ML service error:', error.message);
    try {
      // Fallback to random questions
      const questions = await Question.findAll({ 
        where: { isActive: true },
        limit: 10
      });
      res.json(questions);
    } catch (dbError) {
      res.status(500).json({ error: 'Service temporarily unavailable' });
    }
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
    
    console.log('Browse questions - where clause:', where);
    
    let questions = await Question.findAll({
      where,
      limit: 20
    });
    
    // If no questions in database, return sample questions
    if (questions.length === 0) {
      questions = getSampleQuestions(category, depth);
    }
    
    // Return in expected format
    res.json({ questions });
  } catch (error) {
    console.error('Browse questions error:', error);
    try {
      // Fallback to sample questions on error
      const questions = getSampleQuestions(req.query.category, req.query.depth);
      res.json({ questions });
    } catch (fallbackError) {
      res.status(500).json({ error: 'Unable to retrieve questions' });
    }
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