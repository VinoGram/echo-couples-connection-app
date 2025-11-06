const express = require('express');
const { Op } = require('sequelize');
const GameSession = require('../models/GameSession');
const Question = require('../models/Question');
const User = require('../models/User');
const auth = require('../middleware/auth');
const redis = require('../services/redis');

const router = express.Router();

// Create game session
router.post('/create', auth, async (req, res) => {
  try {
    const { gameType, partnerId } = req.body;
    
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

    // Cache in Redis
    await redis.setEx(`game:${gameSession.id}`, 3600, JSON.stringify(gameSession));

    res.json(gameSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join game
router.post('/:gameId/join', auth, async (req, res) => {
  try {
    const gameSession = await GameSession.findByPk(req.params.gameId);
    if (!gameSession) return res.status(404).json({ error: 'Game not found' });

    if (gameSession.players.length >= 2) {
      return res.status(400).json({ error: 'Game is full' });
    }

    const updatedPlayers = [...gameSession.players, { userId: req.user.id, score: 0, answers: [] }];
    await gameSession.update({
      players: updatedPlayers,
      status: 'active',
      startTime: new Date()
    });

    res.json(gameSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit answer
router.post('/:gameId/answer', auth, async (req, res) => {
  try {
    const { questionId, answer, responseTime } = req.body;
    
    const gameSession = await GameSession.findByPk(req.params.gameId);
    if (!gameSession) return res.status(404).json({ error: 'Game not found' });

    const question = await Question.findByPk(questionId);
    const players = [...gameSession.players];
    const playerIndex = players.findIndex(p => p.userId === req.user.id);
    
    if (playerIndex === -1) return res.status(403).json({ error: 'Not a player in this game' });

    const isCorrect = question.type === 'multiple_choice' 
      ? question.options.find(opt => opt.isCorrect)?.text === answer
      : true;

    players[playerIndex].answers.push({
      questionId,
      answer,
      isCorrect,
      responseTime,
      timestamp: new Date()
    });

    if (isCorrect) players[playerIndex].score += 10;

    await gameSession.update({ players });

    // Update leaderboard
    await redis.zAdd('leaderboard', [{ score: players[playerIndex].score, value: req.user.id }]);

    res.json({ isCorrect, score: players[playerIndex].score });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await redis.zRangeWithScores('leaderboard', 0, 9, { REV: true });
    const userIds = leaderboard.map(entry => entry.value);
    
    const users = await User.findAll({ 
      where: { id: { [Op.in]: userIds } },
      attributes: ['id', 'username']
    });
    
    const result = leaderboard.map(entry => {
      const user = users.find(u => u.id === entry.value);
      return {
        username: user?.username || 'Unknown',
        score: entry.score
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;