const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { Op } = require('sequelize');
const User = require('../models/User');
const auth = require('../middleware/auth');


const router = express.Router();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('Register request received:', { email: req.body.email, username: req.body.username });
    
    const { error } = registerSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, username, password } = req.body;
    
    const existingUser = await User.findOne({ 
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return res.status(400).json({ error: 'User already exists' });
    }

    console.log('Creating new user...');
    const user = await User.create({ 
      email, 
      username, 
      password,
      stats: {
        gamesPlayed: 0,
        totalScore: 0,
        averageScore: 0,
        totalXP: 100, // Starting XP
        currentStreak: 0,
        longestStreak: 0,
        exercisesCompleted: 0,
        lastActivityDate: new Date().toDateString()
      }
    });
    console.log('User created successfully:', user.id);

    // Send welcome email
    try {
      const emailService = require('../services/emailService');
      await emailService.sendWelcomeEmail(email, username);
      console.log('Welcome email sent successfully');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('Registration successful for:', email);
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        partnerId: user.partnerId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login and send login notification
    const now = new Date();
    const lastLogin = user.updatedAt;
    const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
    
    await user.update({ updatedAt: now });
    
    // Send login notification email
    try {
      const emailService = require('../services/emailService');
      await emailService.sendLoginNotification(email, user.username, now);
    } catch (emailError) {
      console.error('Failed to send login notification:', emailError);
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        partnerId: user.partnerId
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Update user with temporary password
    await user.update({ password: tempPassword });
    
    // Send email with temporary password
    try {
      const emailService = require('../services/emailService');
      await emailService.sendTempPassword(email, user.username, tempPassword);
    } catch (emailError) {
      console.error('Failed to send temp password email:', emailError);
    }
    
    res.json({ message: 'Temporary password sent to your email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    const user = await User.findByPk(req.user.id);
    
    // Verify current password
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    await user.update({ password: newPassword });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;