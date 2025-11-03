import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { sendEmail, getWelcomeBackEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !await verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Check if user has been away for a while
    const now = new Date()
    const lastLogin = user.lastLoginAt
    let shouldSendWelcomeBack = false
    let daysSinceLastLogin = 0

    if (lastLogin) {
      const diffTime = Math.abs(now.getTime() - lastLogin.getTime())
      daysSinceLastLogin = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      shouldSendWelcomeBack = daysSinceLastLogin >= 3 // Send if away for 3+ days
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now }
    })

    const token = generateToken(user.id)

    // Send welcome back email if user has been away
    if (shouldSendWelcomeBack) {
      try {
        await sendEmail(getWelcomeBackEmail(email, daysSinceLastLogin))
      } catch (emailError) {
        console.error('Failed to send welcome back email:', emailError)
        // Don't fail login if email fails
      }
    }

    return NextResponse.json({ token, user: { id: user.id, email: user.email } })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}