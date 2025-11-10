const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../utils/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [6, 255] }
  },
  partnerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Users', key: 'id' }
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      notifications: true,
      difficulty: 'medium'
    }
  },
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {
      gamesPlayed: 0,
      totalScore: 0,
      averageScore: 0,
      totalXP: 0,
      currentStreak: 0,
      longestStreak: 0,
      exercisesCompleted: 0,
      lastActivityDate: null
    }
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
      }
    }
  }
});

User.prototype.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Define associations
User.associate = function(models) {
  User.belongsTo(User, { as: 'Partner', foreignKey: 'partnerId' });
};

// Initialize association
User.belongsTo(User, { as: 'Partner', foreignKey: 'partnerId' });

module.exports = User;