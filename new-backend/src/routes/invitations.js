const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Send invitation email
router.post('/send', auth, async (req, res) => {
  try {
    const { email, senderName, connectionCode } = req.body;
    
    const emailService = require('../services/emailService');
    await emailService.sendPartnerInvitation(email, senderName, connectionCode);
    
    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;