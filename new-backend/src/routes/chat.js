const express = require('express');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

// Get messages
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.findAll({
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'username']
      }],
      order: [['createdAt', 'ASC']],
      limit: 100
    });
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.json([]);
  }
});

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content required' });
    }
    
    const message = await Message.create({
      senderId: req.user.id,
      content: content.trim(),
      messageType: 'text'
    });
    
    const messageWithSender = await Message.findByPk(message.id, {
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'username']
      }]
    });
    
    res.json(messageWithSender);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Rate limiting for mark read
const readLimiter = new Map();

// Mark messages as read
router.put('/read', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = Date.now();
    const lastRead = readLimiter.get(userId) || 0;
    
    // Only allow marking as read once every 5 seconds per user
    if (now - lastRead < 5000) {
      return res.json({ success: true, cached: true });
    }
    
    readLimiter.set(userId, now);
    
    await Message.update(
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { 
        where: { 
          senderId: { [require('sequelize').Op.ne]: req.user.id },
          isRead: false
        }
      }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

module.exports = router;