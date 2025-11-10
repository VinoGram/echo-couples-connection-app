const User = require('./User');
const Message = require('./Message');
const Question = require('./Question');
const GameSession = require('./GameSession');
const InviteLink = require('./InviteLink');
const CoupleActivity = require('./CoupleActivity');

// Set up associations
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

module.exports = {
  User,
  Message,
  Question,
  GameSession,
  InviteLink,
  CoupleActivity
};