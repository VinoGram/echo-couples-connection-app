const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const CoupleActivity = sequelize.define('CoupleActivity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  coupleId: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  activityType: {
    type: DataTypes.ENUM('daily_question', 'game', 'exercise', 'quiz'),
    allowNull: false
  },
  activityName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user1Id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  user2Id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  user1Response: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  user2Response: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  bothCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE
  },
  activityData: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
});

module.exports = CoupleActivity;