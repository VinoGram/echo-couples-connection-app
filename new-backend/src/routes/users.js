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
    
    // Check if WhatsApp is configured
    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      return res.status(400).json({ error: 'WhatsApp service not configured. Please use email invitation instead.' });
    }
    
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
    
    const defaultStats = {
      gamesPlayed: 0,
      totalScore: 0,
      averageScore: 0,
      totalXP: 0,
      currentStreak: 0,
      longestStreak: 0,
      exercisesCompleted: 0,
      lastActivityDate: null
    };
    
    const stats = user.stats ? { ...defaultStats, ...user.stats } : defaultStats;
    
    // Calculate level based on 200 XP per level
    const level = Math.floor(stats.totalXP / 200) + 1;
    stats.level = level;
    
    res.json(stats);
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

// Update partner display name
router.put('/partner-name', auth, async (req, res) => {
  try {
    const { partnerName } = req.body;
    const user = await User.findByPk(req.user.id);
    
    const preferences = user.preferences || {};
    preferences.partnerDisplayName = partnerName;
    
    await user.update({ preferences });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get partner display name
router.get('/partner-name', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const partnerName = user.preferences?.partnerDisplayName || null;
    res.json({ partnerName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to add XP (for testing)
router.post('/test-xp', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const currentStats = user.stats || {};
    
    const updatedStats = {
      ...currentStats,
      totalXP: (currentStats.totalXP || 0) + 50,
      currentStreak: (currentStats.currentStreak || 0) + 1,
      gamesPlayed: (currentStats.gamesPlayed || 0) + 1,
      lastActivityDate: new Date().toDateString()
    };
    
    await user.update({ stats: updatedStats });
    res.json({ success: true, stats: updatedStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check user data
router.get('/debug', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json({
      userId: user.id,
      username: user.username,
      email: user.email,
      stats: user.stats,
      partnerId: user.partnerId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    // Get all users with partners and stats
    const users = await User.findAll({
      where: {
        partnerId: { [require('sequelize').Op.not]: null }
      },
      attributes: ['id', 'username', 'partnerId', 'stats'],
      include: [{
        model: User,
        as: 'Partner',
        attributes: ['username']
      }]
    });
    
    // Group couples and calculate combined stats
    const coupleMap = new Map();
    
    users.forEach(user => {
      const coupleKey = [user.id, user.partnerId].sort().join('_');
      
      if (!coupleMap.has(coupleKey)) {
        const stats1 = user.stats || {};
        const partner = users.find(u => u.id === user.partnerId);
        const stats2 = partner?.stats || {};
        
        const totalXP = (stats1.totalXP || 0) + (stats2.totalXP || 0);
        const gamesPlayed = (stats1.gamesPlayed || 0) + (stats2.gamesPlayed || 0);
        const exercisesCompleted = (stats1.exercisesCompleted || 0) + (stats2.exercisesCompleted || 0);
        const maxStreak = Math.max(stats1.currentStreak || 0, stats2.currentStreak || 0);
        
        // Calculate total points: XP + bonus for games + bonus for exercises + streak bonus
        const totalPoints = totalXP + (gamesPlayed * 50) + (exercisesCompleted * 25) + (maxStreak * 100);
        
        coupleMap.set(coupleKey, {
          names: `${user.username} & ${partner?.username || 'Partner'}`,
          streak: maxStreak,
          score: totalPoints,
          totalXP,
          gamesPlayed,
          exercisesCompleted
        });
      }
    });
    
    // Convert to array and sort by total score
    const leaderboard = Array.from(coupleMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((couple, index) => ({
        rank: index + 1,
        names: couple.names,
        streak: couple.streak,
        score: couple.score
      }));
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
});

module.exports = router;