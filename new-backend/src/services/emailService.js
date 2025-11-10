const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendPartnerInvitation(email, senderName, connectionCode) {
    const mailOptions = {
      from: `"Echo App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${senderName} invited you to Echo - Couples Connection App`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e91e63;">💕 You're Invited to Echo!</h2>
          <p>Hi there!</p>
          <p><strong>${senderName}</strong> has invited you to join Echo - the couples connection app that helps strengthen relationships through fun games and meaningful conversations.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #333;">Your Connection Code:</h3>
            <div style="font-size: 24px; font-weight: bold; color: #e91e63; text-align: center; padding: 10px; background: white; border-radius: 5px;">
              ${connectionCode}
            </div>
          </div>
          
          <p><strong>How to get started:</strong></p>
          <ol>
            <li>Download the Echo app or visit our website</li>
            <li>Create your account</li>
            <li>Enter the connection code above</li>
            <li>Start your journey together!</li>
          </ol>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}" style="background: #e91e63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              Join Echo Now
            </a>
          </div>
          
          <p style="color: #666; font-size: 12px;">
            This invitation was sent by ${senderName}. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendDailyReminder(email, username, partnerName) {
    const mailOptions = {
      from: `"Echo App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '💕 Your Daily Echo Reminder',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e91e63;">Good morning, ${username}! 🌅</h2>
          <p>It's time for your daily connection with ${partnerName}!</p>
          
          <div style="background: linear-gradient(135deg, #e91e63, #9c27b0); color: white; padding: 20px; border-radius: 15px; margin: 20px 0;">
            <h3>Today's Suggestions:</h3>
            <ul style="list-style: none; padding: 0;">
              <li>💬 Answer today's question together</li>
              <li>🎮 Play a quick game</li>
              <li>💕 Share an appreciation</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}" style="background: #e91e63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              Open Echo
            </a>
          </div>
        </div>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendGameResult(email, username, gameType, score, partnerScore) {
    const mailOptions = {
      from: `"Echo App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎮 Game Results: ${gameType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e91e63;">Game Complete! 🎉</h2>
          <p>Hi ${username}!</p>
          <p>You just finished playing <strong>${gameType}</strong>!</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3>Results:</h3>
            <p>Your Score: <strong>${score}</strong></p>
            <p>Partner's Score: <strong>${partnerScore}</strong></p>
            <p>Compatibility: <strong>${Math.round((score + partnerScore) / 2)}%</strong></p>
          </div>
          
          <p>Keep playing to strengthen your connection! 💕</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}" style="background: #e91e63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              Play More Games
            </a>
          </div>
        </div>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail(email, username) {
    const mailOptions = {
      from: `"Echo App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Echo - Your Couples Connection Journey Begins! 💕',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Echo! 🎉</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-top: 0;">Hi ${username}! 👋</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
              Welcome to Echo, the app that helps couples grow closer through meaningful conversations and fun activities!
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #ec4899; margin-top: 0;">🚀 You've earned 100 XP to get started!</h3>
              <p style="color: #6b7280;">Ready to connect with your partner and start your journey together?</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}" style="background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">Start Your Journey</a>
            </div>
          </div>
        </div>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendLoginNotification(email, username, loginTime) {
    const mailOptions = {
      from: `"Echo App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Login Alert - Echo Couples App 🔐',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Login Alert 🔐</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-top: 0;">Hi ${username}!</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
              We noticed you just logged into your Echo account.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #374151; margin: 0;"><strong>Login Time:</strong> ${loginTime.toLocaleString()}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              If this wasn't you, please secure your account immediately.
            </p>
          </div>
        </div>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendInactiveUserReminder(email, username, daysSinceLogin) {
    const mailOptions = {
      from: `"Echo App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `We miss you! Come back to Echo 💕`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">We Miss You! 💕</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-top: 0;">Hi ${username}! 👋</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
              It's been ${daysSinceLogin} days since we last saw you on Echo. Your relationship journey is waiting!
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">Continue Your Journey</a>
            </div>
          </div>
        </div>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendActivityCompletionNotification(email, username, partnerName, activityType, activityName) {
    const activityTypeNames = {
      'game': 'Game',
      'quiz': 'Quiz',
      'exercise': 'Exercise',
      'daily_question': 'Daily Question'
    };
    
    const typeName = activityTypeNames[activityType] || 'Activity';
    
    const mailOptions = {
      from: `"Echo App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎉 ${partnerName} completed a ${typeName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Activity Complete! 🎉</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-top: 0;">Hi ${username}! 👋</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
              Great news! <strong>${partnerName}</strong> just completed the <strong>${activityName.replace('_', ' ')}</strong> ${typeName.toLowerCase()}.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #10b981; margin-top: 0;">💕 Ready to see their responses?</h3>
              <p style="color: #6b7280; margin-bottom: 0;">Check out what they shared and compare your answers together!</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">View Results</a>
            </div>
            <p style="color: #9ca3af; font-size: 14px; text-align: center;">
              Keep connecting and growing together! 💕
            </p>
          </div>
        </div>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();