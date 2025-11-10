const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Submit quiz result
router.post('/submit', auth, async (req, res) => {
  try {
    const { quizType, results } = req.body;
    
    if (!quizType || !results) {
      return res.status(400).json({ error: 'Quiz type and results are required' });
    }
    
    // Get user's partner info
    const User = require('../models/User');
    const currentUser = await User.findByPk(req.user.id);
    const partnerId = currentUser?.partnerId;
    
    // Store quiz data in memcached for partner to see
    const today = new Date().toDateString();
    const quizKey = `${quizType}_${today}_${req.user.id}`;
    const partnerQuizKey = partnerId ? `${quizType}_${today}_${partnerId}` : null;
    
    const memcached = require('../services/memcached');
    await memcached.setEx(quizKey, 86400, JSON.stringify({
      userId: req.user.id,
      quizType,
      results,
      submittedAt: new Date()
    }));
    
    // Check if partner has submitted their results
    const partnerData = partnerQuizKey ? await memcached.get(partnerQuizKey) : null;
    const partnerResult = partnerData ? JSON.parse(partnerData) : null;

    res.json({ 
      success: true, 
      bothCompleted: !!partnerResult,
      partnerResults: partnerResult?.results || null
    });
  } catch (error) {
    console.error('Submit quiz result error:', error);
    res.status(500).json({ error: 'Failed to submit quiz result' });
  }
});

// Get partner's quiz results
router.get('/partner-results/:quizType', auth, async (req, res) => {
  try {
    const { quizType } = req.params;
    
    // Get user's partner info
    const User = require('../models/User');
    const currentUser = await User.findByPk(req.user.id);
    const partnerId = currentUser?.partnerId;
    
    if (!partnerId) {
      return res.json({ hasPartner: false, partnerResults: null });
    }
    
    // Get partner's quiz data
    const today = new Date().toDateString();
    const partnerQuizKey = `${quizType}_${today}_${partnerId}`;
    
    const memcached = require('../services/memcached');
    const partnerData = await memcached.get(partnerQuizKey);
    const partnerResult = partnerData ? JSON.parse(partnerData) : null;
    
    res.json({ 
      hasPartner: true, 
      partnerResults: partnerResult?.results || null,
      bothCompleted: !!partnerResult
    });
  } catch (error) {
    console.error('Partner quiz results error:', error);
    res.status(500).json({ error: 'Failed to get partner results' });
  }
});

module.exports = router;