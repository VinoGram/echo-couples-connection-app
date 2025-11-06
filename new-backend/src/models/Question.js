const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('multiple_choice', 'true_false', 'open_ended', 'this_or_that', 'would_you_rather'),
    allowNull: false
  },
  options: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  category: {
    type: DataTypes.ENUM('relationship', 'personal', 'fun', 'deep', 'memories'),
    allowNull: false
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

module.exports = Question;