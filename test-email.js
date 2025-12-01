// Test email functionality
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'promisevino@gmail.com',
    pass: 'xcvd lkzc jhgi yrnt'
  }
});

async function testEmail() {
  try {
    const result = await transporter.sendMail({
      from: '"Echo App" <promisevino@gmail.com>',
      to: 'gramtimevisuals@gmail.com',
      subject: 'Test Email from Echo App',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email to verify the email service is working.</p>
        <p>If you receive this, email notifications are configured correctly!</p>
      `
    });
    
    console.log('Email sent successfully:', result.messageId);
  } catch (error) {
    console.error('Email failed:', error);
  }
}

testEmail();