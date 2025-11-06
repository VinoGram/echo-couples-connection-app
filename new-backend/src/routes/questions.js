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
      limit: parseInt(limit)
    });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get adaptive questions (calls ML service)
router.get('/adaptive', auth, async (req, res) => {
  try {
    const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/questions/adaptive`, {
      user_id: req.user.id,
      partner_id: req.query.partnerId || 'unknown',
      category: req.query.category,
      count: 5
    });

    res.json(mlResponse.data.questions);
  } catch (error) {
    console.error('ML service error:', error.message);
    // Fallback to random questions
    const questions = await Question.findAll({ 
      where: { isActive: true },
      limit: 10
    });
    res.json(questions);
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

module.exports = router;