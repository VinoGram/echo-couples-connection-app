const express = require('express');
const CoupleActivity = require('../models/CoupleActivity');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Submit activity result
router.post('/submit', auth, async (req, res) => {
  try {
    const { activityType, activityName, response, activityData } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!activityType || !activityName || !response) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['activityType', 'activityName', 'response'],
        received: { activityType, activityName, response: !!response }
      });
    }
    
    // Get user's partner
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    if (!user.partnerId) {
      return res.status(400).json({ error: 'No partner linked' });
    }
    
    const coupleId = [userId, user.partnerId].sort().join('_');
    
    // Find or create activity record
    let activity = await CoupleActivity.findOne({
      where: {
        coupleId,
        activityType,
        activityName
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (!activity) {
      activity = await CoupleActivity.create({
        coupleId,
        activityType,
        activityName,
        user1Id: userId,
        user2Id: user.partnerId,
        user1Response: response,
        activityData: activityData || {}
      });
      
      // Send notification to partner for new activity
      try {
        const partner = await User.findByPk(user.partnerId);
        if (partner && partner.preferences?.notifications?.partnerActivityCompleted !== false) {
          const emailService = require('../services/emailService');
          await emailService.sendActivityCompletionNotification(
            partner.email,
            partner.username,
            user.username,
            activityType,
            activityName
          );
        }
      } catch (error) {
        console.error('Failed to send partner notification:', error);
      }
    } else {
      // Allow updates to existing responses
      
      // Update with partner's response
      if (activity.user1Id === userId) {
        activity.user1Response = response;
      } else {
        activity.user2Response = response;
      }
      
      // Check if both completed
      const hasUser1Response = activity.user1Response && 
        (typeof activity.user1Response === 'object' ? Object.keys(activity.user1Response).length > 0 : activity.user1Response);
      const hasUser2Response = activity.user2Response && 
        (typeof activity.user2Response === 'object' ? Object.keys(activity.user2Response).length > 0 : activity.user2Response);
      
      const bothCompleted = hasUser1Response && hasUser2Response;
      
      if (bothCompleted) {
        activity.bothCompleted = true;
        activity.completedAt = new Date();
      }
      
      await activity.save();
      
      // Send notification to partner when user completes activity
      try {
        const partner = await User.findByPk(user.partnerId);
        if (partner && partner.preferences?.notifications?.partnerActivityCompleted !== false) {
          const emailService = require('../services/emailService');
          await emailService.sendActivityCompletionNotification(
            partner.email,
            partner.username,
            user.username,
            activityType,
            activityName
          );
        }
      } catch (error) {
        console.error('Failed to send partner notification:', error);
      }
    }
    
    res.json({
      success: true,
      bothCompleted: activity.bothCompleted,
      activityId: activity.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get activity results
router.get('/results/:activityType/:activityName', auth, async (req, res) => {
  try {
    const { activityType, activityName } = req.params;
    const userId = req.user.id;
    
    const user = await User.findByPk(userId);
    if (!user.partnerId) {
      return res.json({ hasPartner: false, results: null });
    }
    
    const coupleId = [userId, user.partnerId].sort().join('_');
    // For gratitude journal, don't filter by date since it contains historical entries
    const activity = await CoupleActivity.findOne({
      where: {
        coupleId,
        activityType,
        activityName
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (!activity) {
      return res.json({ hasPartner: true, results: null, bothCompleted: false });
    }
    
    // Get partner info
    const partner = await User.findByPk(user.partnerId);
    
    res.json({
      hasPartner: true,
      bothCompleted: activity.bothCompleted,
      results: {
        user: {
          id: userId,
          name: user.username,
          response: activity.user1Id === userId ? activity.user1Response : activity.user2Response
        },
        partner: {
          id: user.partnerId,
          name: partner?.username || 'Partner',
          response: activity.user1Id === userId ? activity.user2Response : activity.user1Response
        },
        activityData: activity.activityData,
        completedAt: activity.completedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create table endpoint
router.post('/create-table', auth, async (req, res) => {
  try {
    await CoupleActivity.sync({ force: false });
    res.json({ success: true, message: 'CoupleActivity table created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to test couple activities
router.post('/test', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user.partnerId) {
      return res.status(400).json({ error: 'No partner linked' });
    }
    
    const coupleId = [userId, user.partnerId].sort().join('_');
    
    // Create a test activity
    const testActivity = await CoupleActivity.create({
      coupleId,
      activityType: 'daily_question',
      activityName: 'test_question',
      user1Id: userId,
      user2Id: user.partnerId,
      user1Response: { answer: 'Test answer from user 1' },
      user2Response: { answer: 'Test answer from user 2' },
      bothCompleted: true,
      completedAt: new Date(),
      activityData: { questionText: 'Test question?' }
    });
    
    res.json({ success: true, activity: testActivity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all couple activities history
router.get('/history', auth, async (req, res) => {
  try {
    // Ensure table exists
    await CoupleActivity.sync({ alter: true });
    
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    console.log('History request - userId:', userId, 'partnerId:', user.partnerId);
    
    if (!user.partnerId) {
      console.log('No partner found');
      return res.json({ 
        activities: [], 
        debug: {
          userId,
          partnerId: null,
          coupleId: null,
          totalActivities: 0,
          completedActivities: 0,
          error: 'No partner linked'
        }
      });
    }
    
    const coupleId = [userId, user.partnerId].sort().join('_');
    console.log('Looking for coupleId:', coupleId);
    
    // Get all activities for debugging
    const allActivities = await CoupleActivity.findAll({
      where: { coupleId }
    });
    console.log('All activities found:', allActivities.length);
    
    const activities = await CoupleActivity.findAll({
      where: {
        coupleId,
        bothCompleted: true
      },
      order: [['completedAt', 'DESC']],
      limit: 50
    });
    
    console.log('Completed activities found:', activities.length);
    
    const partner = await User.findByPk(user.partnerId);
    
    const formattedActivities = activities.map(activity => {
      const userResponse = activity.user1Id === userId ? activity.user1Response : activity.user2Response;
      const partnerResponse = activity.user1Id === userId ? activity.user2Response : activity.user1Response;
      
      return {
        id: activity.id,
        type: activity.activityType,
        name: activity.activityName,
        completedAt: activity.completedAt,
        user: {
          name: user.username,
          response: userResponse || {}
        },
        partner: {
          name: partner?.username || 'Partner',
          response: partnerResponse || {}
        }
      };
    });
    
    res.json({ 
      activities: formattedActivities,
      debug: {
        userId,
        partnerId: user.partnerId,
        coupleId,
        totalActivities: allActivities.length,
        completedActivities: activities.length,
        tableExists: true
      }
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ 
      error: error.message,
      debug: {
        userId: req.user?.id,
        partnerId: null,
        coupleId: null,
        totalActivities: 0,
        completedActivities: 0,
        tableExists: false,
        error: error.message
      }
    });
  }
});

module.exports = router;