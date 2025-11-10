const express = require('express');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Exercise model
const Exercise = sequelize.define('Exercise', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  exerciseType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  data: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  completedAt: {
    type: DataTypes.DATE
  }
});

// Get exercise data
router.get('/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user.id;

    const exercise = await Exercise.findOne({
      where: { userId, exerciseType: type },
      order: [['updatedAt', 'DESC']]
    });

    res.json(exercise?.data || { items: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update exercise data
router.post('/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const { data } = req.body;
    const userId = req.user.id;

    const [exercise, created] = await Exercise.upsert({
      userId,
      exerciseType: type,
      data,
      updatedAt: new Date()
    });

    res.json({ success: true, created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit exercise result
router.post('/submit', auth, async (req, res) => {
  try {
    const { exerciseType, data } = req.body;
    const userId = req.user.id;
    const User = require('../models/User');

    // Get user's partner info
    const currentUser = await User.findByPk(userId);
    const partnerId = currentUser?.partnerId;
    
    // Store exercise data in memcached for partner to see
    const today = new Date().toDateString();
    const exerciseKey = `${exerciseType}_${today}_${userId}`;
    const partnerExerciseKey = partnerId ? `${exerciseType}_${today}_${partnerId}` : null;
    
    const memcached = require('../services/memcached');
    await memcached.setEx(exerciseKey, 86400, JSON.stringify({
      userId,
      exerciseType,
      data,
      submittedAt: new Date()
    }));
    
    // Check if partner has submitted their results
    const partnerData = partnerExerciseKey ? await memcached.get(partnerExerciseKey) : null;
    const partnerResult = partnerData ? JSON.parse(partnerData) : null;

    const exercise = await Exercise.create({
      userId,
      exerciseType,
      data,
      completedAt: new Date()
    });

    // Award XP based on exercise type
    const xpRewards = {
      love_language: 10,
      communication: 10,
      gratitude_journal: 2,
      conflict_resolution: 15,
      appreciation_wall: 5
    };

    const xpEarned = xpRewards[exerciseType] || 5;

    // Update user stats with streak calculation
    const user = await User.findByPk(userId);
    const currentStats = user.stats || {};
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
      totalXP: (currentStats.totalXP || 0) + xpEarned,
      exercisesCompleted: (currentStats.exercisesCompleted || 0) + 1,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, currentStats.longestStreak || 0),
      lastActivityDate: todayDate
    };
    
    await user.update({ stats: updatedStats });

    res.json({ 
      success: true, 
      exerciseId: exercise.id,
      xpEarned,
      totalXP: updatedStats.totalXP,
      streak: newStreak,
      bothCompleted: !!partnerResult,
      partnerData: partnerResult?.data || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get partner's exercise results
router.get('/partner-results/:exerciseType', auth, async (req, res) => {
  try {
    const { exerciseType } = req.params;
    
    // Get user's partner info
    const User = require('../models/User');
    const currentUser = await User.findByPk(req.user.id);
    const partnerId = currentUser?.partnerId;
    
    if (!partnerId) {
      return res.json({ hasPartner: false, partnerData: null });
    }
    
    // Get partner's exercise data
    const today = new Date().toDateString();
    const partnerExerciseKey = `${exerciseType}_${today}_${partnerId}`;
    
    const memcached = require('../services/memcached');
    const partnerData = await memcached.get(partnerExerciseKey);
    const partnerResult = partnerData ? JSON.parse(partnerData) : null;
    
    res.json({ 
      hasPartner: true, 
      partnerData: partnerResult?.data || null,
      bothCompleted: !!partnerResult
    });
  } catch (error) {
    console.error('Partner exercise results error:', error);
    res.status(500).json({ error: 'Failed to get partner results' });
  }
});

module.exports = router;