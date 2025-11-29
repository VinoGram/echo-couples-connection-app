const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Create couple/connection
router.post('/create', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const connectionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    await user.update({ 
      preferences: { 
        ...user.preferences, 
        connectionCode,
        isHost: true 
      } 
    });
    
    res.json({ connectionCode, message: 'Connection created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send connection code via email
router.post('/send-code', auth, async (req, res) => {
  try {
    const { email, connectionCode } = req.body;
    const user = await User.findByPk(req.user.id);
    
    const emailService = require('../services/emailService');
    await emailService.sendPartnerInvitation(email, user.username, connectionCode);
    
    res.json({ message: 'Connection code sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join couple using connection code
router.post('/join', auth, async (req, res) => {
  try {
    const { connectionCode } = req.body;
    const user = await User.findByPk(req.user.id);
    
    const host = await User.findOne({
      where: {
        preferences: {
          connectionCode
        }
      }
    });
    
    if (!host) {
      return res.status(404).json({ error: 'Invalid connection code' });
    }
    
    await user.update({ partnerId: host.id });
    await host.update({ partnerId: user.id });
    
    res.json({ message: 'Successfully connected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current couple info
router.get('/current', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user.partnerId) {
      // Return empty couple state instead of 404
      return res.json({
        id: user.id,
        connectionCode: user.preferences?.connectionCode || null,
        isComplete: false,
        partner: null,
        partnerName: null
      });
    }
    
    const partner = await User.findByPk(user.partnerId);
    const partnerDisplayName = user.preferences?.partnerDisplayName || partner?.username || 'Partner';
    
    res.json({
      id: user.id,
      connectionCode: user.preferences?.connectionCode,
      isComplete: !!user.partnerId,
      partnerName: partnerDisplayName,
      partner: partner ? {
        id: partner.id,
        username: partner.username
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;