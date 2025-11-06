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
}

module.exports = new EmailService();