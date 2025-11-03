import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { sendEmail, getWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, password, gender } = await request.json()

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        lastLoginAt: new Date(),
        profile: {
          create: {
            displayName: 'You',
            gender,
            totalXP: 0,
            level: 1,
            currentStreak: 0,
            longestStreak: 0,
            achievements: '[]',
            notificationPreferences: JSON.stringify({
              dailyQuestion: true,
              partnerAnswered: true,
              streakMilestones: true,
              newUnlocks: true,
              preferredTime: 'evening',
              enabled: true
            })
          }
        }
      }
    })

    const token = generateToken(user.id)

    // Send welcome email
    try {
      await sendEmail(getWelcomeEmail(email))
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail registration if email fails
    }

    return NextResponse.json({ token, user: { id: user.id, email: user.email } })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}