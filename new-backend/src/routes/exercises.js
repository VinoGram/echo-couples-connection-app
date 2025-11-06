const express = require('express');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');
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
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user?.id;

    const exercise = await Exercise.findOne({
      where: { userId, exerciseType: type }
    });

    res.json(exercise?.data || { items: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update exercise data
router.post('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { data } = req.body;
    const userId = req.user?.id;

    await Exercise.upsert({
      userId,
      exerciseType: type,
      data
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit exercise result
router.post('/submit', async (req, res) => {
  try {
    const { exerciseType, data } = req.body;
    const userId = req.user?.id;

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

    res.json({ 
      success: true, 
      exerciseId: exercise.id,
      xpEarned 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;