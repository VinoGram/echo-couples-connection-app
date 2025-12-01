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

// Generate OTP for password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Forgot password request for:', email);
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({ error: 'Email not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store OTP in dedicated table
    const OTP = require('../models/OTP');
    await OTP.destroy({ where: { email } }); // Remove any existing OTP
    await OTP.create({
      email,
      otp,
      expiresAt: otpExpiry
    });
    
    console.log('OTP stored in OTP table:', { email, otp, expiry: otpExpiry.toISOString() });
    
    res.json({ 
      message: 'OTP generated successfully',
      otp: otp,
      expiresIn: '10 minutes'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check OTP data
router.post('/debug-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({ error: 'User not found' });
    }
    
    const preferences = user.preferences || {};
    res.json({
      email,
      hasOTP: !!preferences.resetOTP,
      otp: preferences.resetOTP,
      expiry: preferences.resetOTPExpiry,
      isExpired: preferences.resetOTPExpiry ? new Date() > new Date(preferences.resetOTPExpiry) : null
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Verify OTP and reset password
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    console.log('OTP verification request:', { email, otp: otp, newPasswordLength: newPassword?.length });
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found for OTP verification:', email);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get OTP from dedicated table
    const OTP = require('../models/OTP');
    const otpRecord = await OTP.findOne({ where: { email } });
    
    console.log('OTP record found:', otpRecord ? { otp: otpRecord.otp, expiresAt: otpRecord.expiresAt } : 'No record');
    
    if (!otpRecord) {
      console.log('No OTP found for user');
      return res.status(400).json({ error: 'No OTP found. Please generate a new one.' });
    }
    
    if (otpRecord.otp !== otp) {
      console.log('OTP mismatch:', { stored: otpRecord.otp, provided: otp });
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    if (new Date() > otpRecord.expiresAt) {
      console.log('OTP expired');
      await OTP.destroy({ where: { email } }); // Clean up expired OTP
      return res.status(400).json({ error: 'OTP has expired' });
    }
    
    // Update password and delete OTP
    await user.update({ password: newPassword });
    await OTP.destroy({ where: { email } });
    
    console.log('Password reset successful for:', email);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('OTP verification error:', error);
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