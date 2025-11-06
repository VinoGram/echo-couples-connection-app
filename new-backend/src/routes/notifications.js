const express = require('express');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const User = require('../models/User');

const router = express.Router();

// Send partner invitation
router.post('/invite-partner', auth, async (req, res) => {
  try {
    const { email, phoneNumber, senderName, connectionCode } = req.body;
    
    const results = {};
    
    // Send email invitation
    if (email) {
      try {
        await emailService.sendPartnerInvitation(email, senderName, connectionCode);
        results.email = 'sent';
      } catch (error) {
        results.email = 'failed';
        console.error('Email invitation failed:', error);
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
        console.error('WhatsApp invitation failed:', error);
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send daily reminders
router.post('/daily-reminder', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
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
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send game notification
router.post('/game-invite', auth, async (req, res) => {
  try {
    const { gameType, partnerId } = req.body;
    const user = await User.findByPk(req.user.id);
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
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const user = await User.findByPk(req.user.id);
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
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;