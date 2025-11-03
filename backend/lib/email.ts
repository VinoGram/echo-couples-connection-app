import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(options: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Echo <noreply@yourdomain.com>', // Replace with your verified domain
      to: [options.to],
      subject: options.subject,
      html: options.html,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    console.log('📧 Email sent successfully:', data?.id)
    return { success: true, data }
  } catch (error) {
    console.error('Email service error:', error)
    return { success: false, error }
  }
}

export function getWelcomeEmail(email: string): EmailOptions {
  return {
    to: email,
    subject: '💕 Welcome to Echo - Your Journey Begins!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fdf2f8 0%, #ffffff 50%, #faf5ff 100%); padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
            <span style="color: white; font-size: 24px;">💕</span>
          </div>
          <h1 style="color: #ec4899; margin: 0; font-size: 32px;">Welcome to Echo!</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Couples Connection</p>
        </div>
        
        <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #374151; margin-top: 0;">Your relationship journey starts now! 🚀</h2>
          
          <p style="color: #6b7280; line-height: 1.6;">
            Welcome to Echo, where meaningful conversations bring couples closer together. 
            You've just taken the first step toward deepening your connection!
          </p>
          
          <div style="margin: 25px 0;">
            <h3 style="color: #ec4899; margin-bottom: 15px;">What's waiting for you:</h3>
            <ul style="color: #6b7280; line-height: 1.8;">
              <li>🗣️ <strong>Daily Questions</strong> - Meaningful conversations every day</li>
              <li>🎮 <strong>Fun Games</strong> - Play together, grow together</li>
              <li>📈 <strong>Progress Tracking</strong> - Level up your relationship</li>
              <li>💬 <strong>Private Chat</strong> - Your own couple's space</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173" style="background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Start Your Journey
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-bottom: 0;">
            Ready to go beyond "What's for dinner?" Let's build something beautiful together.
          </p>
        </div>
      </div>
    `
  }
}

export function getWelcomeBackEmail(email: string, daysSinceLastLogin: number): EmailOptions {
  return {
    to: email,
    subject: '💕 We missed you! Your partner is waiting',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fdf2f8 0%, #ffffff 50%, #faf5ff 100%); padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
            <span style="color: white; font-size: 24px;">💕</span>
          </div>
          <h1 style="color: #ec4899; margin: 0; font-size: 32px;">Welcome back to Echo!</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">We missed you</p>
        </div>
        
        <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #374151; margin-top: 0;">It's been ${daysSinceLastLogin} days! 🗓️</h2>
          
          <p style="color: #6b7280; line-height: 1.6;">
            Your relationship deserves daily attention, and we're here to help you reconnect. 
            ${daysSinceLastLogin > 7 ? 'Your partner might be wondering where you\'ve been!' : 'Let\'s pick up where you left off.'}
          </p>
          
          <div style="margin: 25px 0;">
            <h3 style="color: #ec4899; margin-bottom: 15px;">What you've been missing:</h3>
            <ul style="color: #6b7280; line-height: 1.8;">
              <li>🗣️ New daily questions to explore together</li>
              <li>🎮 Fun games to reconnect and laugh</li>
              <li>💬 Messages from your partner</li>
              <li>📈 Opportunities to level up your relationship</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173" style="background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Reconnect Now
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-bottom: 0;">
            Every day is a chance to grow closer. Let's make today count! 💕
          </p>
        </div>
      </div>
    `
  }
}