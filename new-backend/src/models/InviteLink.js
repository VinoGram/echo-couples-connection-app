const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const InviteLink = sequelize.define('InviteLink', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  inviterId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  partnerPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

module.exports = InviteLink;