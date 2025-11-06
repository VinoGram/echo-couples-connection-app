const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const GameSession = sequelize.define('GameSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  players: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  gameType: {
    type: DataTypes.ENUM('daily_question', 'quiz', 'this_or_that', 'would_you_rather', 'memory_lane', 'truth_or_dare', 'love_language', 'couple_trivia', 'date_night_planner', 'relationship_goals', 'story_builder'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('waiting', 'active', 'completed', 'abandoned'),
    defaultValue: 'waiting'
  },
  questions: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  startTime: {
    type: DataTypes.DATE
  },
  endTime: {
    type: DataTypes.DATE
  },
  duration: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: true
});

module.exports = GameSession;