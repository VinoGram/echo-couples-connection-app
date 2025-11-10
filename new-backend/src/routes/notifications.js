const express = require('express');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const User = require('../models/User');

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Notifications route working' });
});

// Get notification settings
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const notifications = user.preferences?.notifications || {};
    
    const preferences = {
      dailyQuestion: notifications.dailyQuestion !== false,
      partnerAnswered: notifications.partnerAnswered !== false,
      partnerActivityCompleted: notifications.partnerActivityCompleted !== false,
      streakMilestones: notifications.streakMilestones !== false,
      newUnlocks: notifications.newUnlocks !== false,
      preferredTime: notifications.preferredTime || 'evening',
      enabled: notifications.enabled !== false
    };
    
    res.json({ preferences });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update notification settings
router.put('/settings', auth, async (req, res) => {
  try {
    const preferences = req.body;
    const user = await User.findByPk(req.user.id);
    
    const updatedPreferences = {
      ...user.preferences,
      notifications: preferences
    };
    
    await user.update({ preferences: updatedPreferences });
    res.json({ success: true, preferences });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unsubscribe from all notifications
router.delete('/settings', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    const updatedPreferences = {
      ...user.preferences,
      notifications: {
        dailyQuestion: false,
        partnerAnswered: false,
        partnerActivityCompleted: false,
        streakMilestones: false,
        newUnlocks: false,
        preferredTime: 'evening',
        enabled: false
      }
    };
    
    await user.update({ preferences: updatedPreferences });
    res.json({ success: true, message: 'Unsubscribed from all notifications' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send partner invitation
router.post('/invite-partner', auth, async (req, res) => {
  try {
    const { email, phoneNumber, senderName, connectionCode } = req.body;
    
    // Input validation
    if (!senderName || !connectionCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'Email or phone number required' });
    }
    
    const results = {};
    
    // Send email invitation
    if (email) {
      try {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          results.email = 'invalid';
        } else {
          await emailService.sendPartnerInvitation(email, senderName, connectionCode);
          results.email = 'sent';
        }
      } catch (error) {
        results.email = 'failed';
        console.error('Email invitation failed:', error.message);
      }
    }
    
    // Send WhatsApp invitation
    if (phoneNumber) {
      try {
        const formattedPhone = whatsappService.formatPhoneNumber(phoneNumber);
        await whatsappService.sendPartnerInvitation(formattedPhone, senderName, connectionCode);
        results.whatsapp = 'sent';
      } catch (error) {
        results.whatsapp = 'failed';
        console.error('WhatsApp invitation failed:', error.message);
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Invite partner error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Send daily reminders
router.post('/daily-reminder', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const partner = user.partnerId ? await User.findByPk(user.partnerId) : null;
    
    if (!partner) {
      return res.status(400).json({ error: 'No partner linked' });
    }
    
    const results = {};
    
    // Send email reminder
    if (user.email && user.preferences?.notifications?.email) {
      try {
        await emailService.sendDailyReminder(user.email, user.username, partner.username);
        results.email = 'sent';
      } catch (error) {
        results.email = 'failed';
        console.error('Email reminder failed:', error.message);
      }
    }
    
    // Send WhatsApp reminder
    if (user.preferences?.phoneNumber && user.preferences?.notifications?.whatsapp) {
      try {
        const formattedPhone = whatsappService.formatPhoneNumber(user.preferences.phoneNumber);
        await whatsappService.sendDailyReminder(formattedPhone, user.username, partner.username);
        results.whatsapp = 'sent';
      } catch (error) {
        results.whatsapp = 'failed';
        console.error('WhatsApp reminder failed:', error.message);
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Daily reminder error:', error);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});

// Send game notification
router.post('/game-invite', auth, async (req, res) => {
  try {
    const { gameType, partnerId } = req.body;
    
    // Input validation
    if (!gameType || !partnerId) {
      return res.status(400).json({ error: 'Game type and partner ID required' });
    }
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const partner = await User.findByPk(partnerId);
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    const results = {};
    
    // Send WhatsApp game notification
    if (partner.preferences?.phoneNumber && partner.preferences?.notifications?.whatsapp) {
      try {
        const formattedPhone = whatsappService.formatPhoneNumber(partner.preferences.phoneNumber);
        await whatsappService.sendGameNotification(formattedPhone, partner.username, gameType, user.username);
        results.whatsapp = 'sent';
      } catch (error) {
        results.whatsapp = 'failed';
        console.error('Game invite failed:', error.message);
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Game invite error:', error);
    res.status(500).json({ error: 'Failed to send game invite' });
  }
});

// Send game results
router.post('/game-result', auth, async (req, res) => {
  try {
    const { gameType, score, partnerScore, compatibilityScore } = req.body;
    const user = await User.findByPk(req.user.id);
    const partner = user.partnerId ? await User.findByPk(user.partnerId) : null;
    
    const results = {};
    
    // Send email results
    if (user.email && user.preferences?.notifications?.email) {
      try {
        await emailService.sendGameResult(user.email, user.username, gameType, score, partnerScore);
        results.email = 'sent';
      } catch (error) {
        results.email = 'failed';
      }
    }
    
    // Send WhatsApp results
    if (user.preferences?.phoneNumber && user.preferences?.notifications?.whatsapp) {
      try {
        const formattedPhone = whatsappService.formatPhoneNumber(user.preferences.phoneNumber);
        await whatsappService.sendGameResult(formattedPhone, user.username, gameType, compatibilityScore);
        results.whatsapp = 'sent';
      } catch (error) {
        results.whatsapp = 'failed';
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send appreciation notification
router.post('/appreciation', auth, async (req, res) => {
  try {
    const { appreciation, partnerId } = req.body;
    
    // Input validation
    if (!appreciation || !partnerId) {
      return res.status(400).json({ error: 'Appreciation message and partner ID required' });
    }
    
    if (typeof appreciation !== 'string' || appreciation.length > 500) {
      return res.status(400).json({ error: 'Invalid appreciation message' });
    }
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const partner = await User.findByPk(partnerId);
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    const results = {};
    
    // Send WhatsApp appreciation
    if (partner.preferences?.phoneNumber && partner.preferences?.notifications?.whatsapp) {
      try {
        const formattedPhone = whatsappService.formatPhoneNumber(partner.preferences.phoneNumber);
        await whatsappService.sendAppreciationNotification(formattedPhone, user.username, appreciation);
        results.whatsapp = 'sent';
      } catch (error) {
        results.whatsapp = 'failed';
        console.error('Appreciation notification failed:', error.message);
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Appreciation error:', error);
    res.status(500).json({ error: 'Failed to send appreciation' });
  }
});

module.exports = router;