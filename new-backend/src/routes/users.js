const express = require('express');
const User = require('../models/User');
const InviteLink = require('../models/InviteLink');
const auth = require('../middleware/auth');
const whatsappService = require('../services/whatsappService');
const crypto = require('crypto');

const router = express.Router();

// Send WhatsApp invitation
router.post('/invite-partner', auth, async (req, res) => {
  try {
    const { partnerPhone } = req.body;
    const user = await User.findByPk(req.user.id);
    
    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Create invite link
    await InviteLink.create({
      token,
      inviterId: user.id,
      partnerPhone,
      expiresAt
    });
    
    const inviteUrl = `${process.env.FRONTEND_URL}/join/${token}`;
    
    // Send WhatsApp message
    await whatsappService.sendPartnerInvite(partnerPhone, user.username, inviteUrl);
    
    res.json({ message: 'Invitation sent via WhatsApp' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept invitation via link
router.post('/accept-invite/:token', auth, async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findByPk(req.user.id);
    
    const invite = await InviteLink.findOne({ 
      where: { token, used: false }
    });
    
    if (!invite || invite.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }
    
    const inviter = await User.findByPk(invite.inviterId);
    
    // Link partners
    await user.update({ partnerId: inviter.id });
    await inviter.update({ partnerId: user.id });
    await invite.update({ used: true });
    
    res.json({ message: 'Partner linked successfully', partner: { username: inviter.username } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Link partner (existing method)
router.post('/link-partner', auth, async (req, res) => {
  try {
    const { partnerEmail } = req.body;
    
    const partner = await User.findOne({ where: { email: partnerEmail } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });

    const user = await User.findByPk(req.user.id);
    await user.update({ partnerId: partner.id });
    await partner.update({ partnerId: user.id });

    res.json({ message: 'Partner linked successfully', partner: { username: partner.username } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['stats']
    });
    res.json(user.stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const updatedPreferences = { ...user.preferences, ...req.body };
    await user.update({ preferences: updatedPreferences });
    
    res.json(updatedPreferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;