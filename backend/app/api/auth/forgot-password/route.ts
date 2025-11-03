import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedTempPassword = await hashPassword(tempPassword)

    // Update user with temporary password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedTempPassword }
    })

    // Send email with temporary password
    await sendEmail({
      to: email,
      subject: '🔑 Your Echo Temporary Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fdf2f8 0%, #ffffff 50%, #faf5ff 100%); padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
              <span style="color: white; font-size: 24px;">🔑</span>
            </div>
            <h1 style="color: #ec4899; margin: 0; font-size: 28px;">Password Reset</h1>
          </div>
          
          <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #374151; margin-top: 0;">Your temporary password is ready!</h2>
            
            <p style="color: #6b7280; line-height: 1.6;">
              We've generated a temporary password for your Echo account. Use this to sign in, then change it to something memorable.
            </p>
            
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
              <p style="color: #374151; margin: 0 0 10px 0; font-weight: bold;">Your temporary password:</p>
              <code style="background: #e5e7eb; padding: 8px 16px; border-radius: 4px; font-size: 18px; font-weight: bold; color: #1f2937;">${tempPassword}</code>
            </div>
            
            <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                ⚠️ <strong>Important:</strong> Please change this password after logging in for security.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173" style="background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Sign In Now
              </a>
            </div>
          </div>
        </div>
      `
    })

    return NextResponse.json({ message: 'Temporary password sent to your email' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}