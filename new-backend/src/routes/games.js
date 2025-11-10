const express = require('express');
const { Op } = require('sequelize');
const GameSession = require('../models/GameSession');
const Question = require('../models/Question');
const User = require('../models/User');
const auth = require('../middleware/auth');
const memcached = require('../services/memcached');

const router = express.Router();

// Create game session
router.post('/create', auth, async (req, res) => {
  try {
    const { gameType, partnerId } = req.body;
    
    // Input validation
    if (!gameType) {
      return res.status(400).json({ error: 'Game type is required' });
    }
    
    const validGameTypes = ['relationship', 'fun', 'compatibility', 'daily'];
    if (!validGameTypes.includes(gameType)) {
      return res.status(400).json({ error: 'Invalid game type' });
    }
    
    const questions = await Question.findAll({ 
      where: {
        category: { [Op.in]: ['relationship', 'fun'] },
        isActive: true 
      },
      limit: 10
    });

    const gameSession = await GameSession.create({
      players: [
        { userId: req.user.id, score: 0, answers: [] },
        ...(partnerId ? [{ userId: partnerId, score: 0, answers: [] }] : [])
      ],
      gameType,
      questions: questions.map(q => q.id),
      status: 'waiting'
    });

    // Cache in Memcached
    try {
      await memcached.setEx(`game:${gameSession.id}`, 3600, JSON.stringify(gameSession));
    } catch (memcachedError) {
      console.error('Memcached cache error:', memcachedError.message);
    }

    res.json(gameSession);
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Failed to create game session' });
  }
});

// Join game
router.post('/:gameId/join', auth, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Input validation
    if (!gameId || isNaN(gameId)) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }
    
    const gameSession = await GameSession.findByPk(gameId);
    if (!gameSession) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (gameSession.players.length >= 2) {
      return res.status(400).json({ error: 'Game is full' });
    }
    
    // Check if user is already in the game
    const isAlreadyPlayer = gameSession.players.some(p => p.userId === req.user.id);
    if (isAlreadyPlayer) {
      return res.status(400).json({ error: 'Already joined this game' });
    }

    const updatedPlayers = [...gameSession.players, { userId: req.user.id, score: 0, answers: [] }];
    await gameSession.update({
      players: updatedPlayers,
      status: 'active',
      startTime: new Date()
    });

    res.json(gameSession);
  } catch (error) {
    console.error('Join game error:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

// Submit answer
router.post('/:gameId/answer', auth, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { questionId, answer, responseTime } = req.body;
    
    // Input validation
    if (!gameId || isNaN(gameId)) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }
    
    if (!questionId || !answer) {
      return res.status(400).json({ error: 'Question ID and answer are required' });
    }
    
    if (typeof answer !== 'string' || answer.length > 1000) {
      return res.status(400).json({ error: 'Invalid answer format' });
    }
    
    const gameSession = await GameSession.findByPk(gameId);
    if (!gameSession) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const question = await Question.findByPk(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    const players = [...gameSession.players];
    const playerIndex = players.findIndex(p => p.userId === req.user.id);
    
    if (playerIndex === -1) {
      return res.status(403).json({ error: 'Not a player in this game' });
    }

    const isCorrect = question.type === 'multiple_choice' 
      ? question.options?.find(opt => opt.isCorrect)?.text === answer
      : true;

    players[playerIndex].answers.push({
      questionId,
      answer: answer.trim(),
      isCorrect,
      responseTime: Math.max(0, parseInt(responseTime) || 0),
      timestamp: new Date()
    });

    if (isCorrect) players[playerIndex].score += 10;

    await gameSession.update({ players });

    // Update leaderboard
    try {
      await memcached.zAdd('leaderboard', [{ score: players[playerIndex].score, value: req.user.id }]);
    } catch (memcachedError) {
      console.error('Memcached leaderboard error:', memcachedError.message);
    }

    res.json({ isCorrect, score: players[playerIndex].score });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Submit game result
router.post('/submit', auth, async (req, res) => {
  try {
    const { gameType, data } = req.body;
    
    if (!gameType || !data) {
      return res.status(400).json({ error: 'Game type and data are required' });
    }
    
    // Get user's partner info
    const User = require('../models/User');
    const currentUser = await User.findByPk(req.user.id);
    const partnerId = currentUser?.partnerId;
    
    // Store user's game data in memcached for partner to see
    const today = new Date().toDateString();
    const gameKey = `${gameType}_${today}_${req.user.id}`;
    const partnerGameKey = partnerId ? `${gameType}_${today}_${partnerId}` : null;
    
    const memcached = require('../services/memcached');
    await memcached.setEx(gameKey, 86400, JSON.stringify({
      userId: req.user.id,
      gameType,
      data,
      submittedAt: new Date()
    }));
    
    // Check if partner has submitted their results
    const partnerData = partnerGameKey ? await memcached.get(partnerGameKey) : null;
    const partnerResult = partnerData ? JSON.parse(partnerData) : null;
    
    // Send game data to ML service for learning
    try {
      if (process.env.ML_SERVICE_URL) {
        const axios = require('axios');
        await axios.post(`${process.env.ML_SERVICE_URL}/games/submit-response`, {
          user_id: req.user.id,
          partner_id: partnerId || 'unknown',
          game_type: gameType,
          game_data: data,
          session_id: `${gameType}_${today}_${req.user.id}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (mlError) {
      console.error('ML service game submission error:', mlError.message);
      // Continue without failing the request
    }
    
    // Create game session
    const gameSession = await GameSession.create({
      players: [{ userId: req.user.id, score: 0, answers: [data] }],
      gameType: 'quiz',
      status: 'completed',
      startTime: new Date(),
      endTime: new Date(),
      gameData: data
    });

    // Update user stats with XP and game count
    const currentStats = currentUser.stats || {};
    const xpEarned = 20; // XP for completing a game
    
    const updatedStats = {
      ...currentStats,
      totalXP: (currentStats.totalXP || 0) + xpEarned,
      gamesPlayed: (currentStats.gamesPlayed || 0) + 1,
      lastActivityDate: new Date().toDateString()
    };
    
    await currentUser.update({ stats: updatedStats });

    res.json({ 
      success: true, 
      gameId: gameSession.id,
      xpEarned,
      totalXP: updatedStats.totalXP,
      bothCompleted: !!partnerResult,
      partnerData: partnerResult?.data || null,
      mlLearningEnabled: !!process.env.ML_SERVICE_URL
    });
  } catch (error) {
    console.error('Submit game result error:', error);
    res.status(500).json({ error: 'Failed to submit game result' });
  }
});

// Get partner's game results
router.get('/partner-results/:gameType', auth, async (req, res) => {
  try {
    const { gameType } = req.params;
    
    // Get user's partner info
    const User = require('../models/User');
    const currentUser = await User.findByPk(req.user.id);
    const partnerId = currentUser?.partnerId;
    
    if (!partnerId) {
      return res.json({ hasPartner: false, partnerData: null });
    }
    
    // Get partner's game data
    const today = new Date().toDateString();
    const partnerGameKey = `${gameType}_${today}_${partnerId}`;
    
    const memcached = require('../services/memcached');
    const partnerData = await memcached.get(partnerGameKey);
    const partnerResult = partnerData ? JSON.parse(partnerData) : null;
    
    res.json({ 
      hasPartner: true, 
      partnerData: partnerResult?.data || null,
      bothCompleted: !!partnerResult
    });
  } catch (error) {
    console.error('Partner results error:', error);
    res.status(500).json({ error: 'Failed to get partner results' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    // Mock leaderboard data
    const mockLeaderboard = [
      { rank: 1, names: "Alex & Sam", streak: 15, score: 1250, badge: "👑" },
      { rank: 2, names: "Jordan & Casey", streak: 12, score: 980, badge: "🥈" },
      { rank: 3, names: "Taylor & Morgan", streak: 8, score: 750, badge: "🥉" }
    ];
    
    res.json(mockLeaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
});

module.exports = router;