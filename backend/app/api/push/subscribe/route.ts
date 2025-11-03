import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = verifyToken(token)
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { endpoint, keys } = await request.json()

    // For now, just update user preferences to indicate push is enabled
    await prisma.userProfile.update({
      where: { userId },
      data: {
        notificationPreferences: JSON.stringify({
          dailyQuestion: true,
          partnerAnswered: true,
          streakMilestones: true,
          newUnlocks: true,
          preferredTime: 'evening',
          enabled: true,
          pushEnabled: true,
          pushEndpoint: endpoint
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = verifyToken(token)
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    })

    if (profile) {
      const prefs = JSON.parse(profile.notificationPreferences)
      prefs.pushEnabled = false
      
      await prisma.userProfile.update({
        where: { userId },
        data: {
          notificationPreferences: JSON.stringify(prefs)
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}