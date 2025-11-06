const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v18.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  }

  async sendMessage(to, message) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('WhatsApp send error:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendTemplate(to, templateName, parameters = []) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: parameters.length > 0 ? [{
              type: 'body',
              parameters: parameters.map(param => ({ type: 'text', text: param }))
            }] : []
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('WhatsApp template error:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendPartnerInvite(phoneNumber, inviterName, inviteUrl) {
    const message = `💕 *You're invited to Echo!*\n\n${inviterName} wants to connect with you on Echo - the couples app that strengthens relationships.\n\n👉 *Click to join:*\n${inviteUrl}\n\n⏰ This link expires in 24 hours.\n\nStart your journey together! 🎉`;
    
    return this.sendMessage(phoneNumber, message);
  }

  async sendPartnerInvitation(phoneNumber, senderName, connectionCode) {
    const message = `💕 *Echo - Couples Connection*\n\nHi! ${senderName} has invited you to join Echo, the app that helps couples strengthen their relationship through fun games and meaningful conversations.\n\n🔑 *Your Connection Code:* ${connectionCode}\n\n*How to join:*\n1. Download Echo app\n2. Create your account\n3. Enter code: ${connectionCode}\n4. Start connecting!\n\n👉 Get started: ${process.env.FRONTEND_URL}`;
    
    return this.sendMessage(phoneNumber, message);
  }

  async sendDailyReminder(phoneNumber, username, partnerName) {
    const message = `🌅 Good morning ${username}!\n\nTime for your daily connection with ${partnerName}! 💕\n\n*Today's suggestions:*\n💬 Answer today's question\n🎮 Play a quick game\n💕 Share an appreciation\n\n👉 Open Echo: ${process.env.FRONTEND_URL}`;
    
    return this.sendMessage(phoneNumber, message);
  }

  async sendGameNotification(phoneNumber, username, gameType, partnerName) {
    const message = `🎮 *Game Time!*\n\n${partnerName} wants to play *${gameType}* with you!\n\nJoin now to see how compatible you are! 💕\n\n👉 Play now: ${process.env.FRONTEND_URL}`;
    
    return this.sendMessage(phoneNumber, message);
  }

  async sendGameResult(phoneNumber, username, gameType, compatibilityScore) {
    const message = `🎉 *Game Complete!*\n\nYou just finished *${gameType}*!\n\n📊 *Compatibility Score:* ${compatibilityScore}%\n\n${compatibilityScore > 80 ? '🔥 Amazing connection!' : compatibilityScore > 60 ? '💕 Great compatibility!' : '🌱 Room to grow together!'}\n\n👉 Play more: ${process.env.FRONTEND_URL}`;
    
    return this.sendMessage(phoneNumber, message);
  }

  async sendAppreciationNotification(phoneNumber, senderName, appreciation) {
    const message = `💕 *New Appreciation*\n\n${senderName} shared something special:\n\n"${appreciation}"\n\n👉 Respond: ${process.env.FRONTEND_URL}`;
    
    return this.sendMessage(phoneNumber, message);
  }

  formatPhoneNumber(phone) {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if missing (assuming US +1)
    if (cleaned.length === 10) {
      return `1${cleaned}`;
    }
    
    return cleaned;
  }
}

module.exports = new WhatsAppService();