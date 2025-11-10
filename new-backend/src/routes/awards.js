const express = require('express');
const { Op } = require('sequelize');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    // Get users with partners, ordered by total XP
    const users = await User.findAll({
      where: {
        partnerId: { [Op.not]: null }
      },
      attributes: ['id', 'username', 'stats'],
      include: [{
        model: User,
        as: 'Partner',
        attributes: ['username']
      }],
      limit: 10
    });

    // Group couples and calculate combined stats
    const couples = new Map();
    
    users.forEach(user => {
      const coupleKey = [user.id, user.partnerId].sort().join('-');
      
      if (!couples.has(coupleKey)) {
        const stats = user.stats || {};
        const partnerName = user.Partner?.username || 'Partner';
        
        couples.set(coupleKey, {
          names: `${user.username} & ${partnerName}`,
          streak: stats.currentStreak || 0,
          score: stats.totalXP || 0
        });
      }
    });

    // Convert to array and sort by score
    const leaderboard = Array.from(couples.values())
      .sort((a, b) => b.score - a.score)
      .map((couple, index) => ({
        rank: index + 1,
        ...couple,
        badge: index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'
      }));
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;