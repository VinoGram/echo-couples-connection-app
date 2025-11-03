import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const couple = await prisma.couple.findFirst({
      where: {
        OR: [
          { user1Id: user.userId },
          { user2Id: user.userId }
        ]
      },
      include: {
        user1: { include: { profile: true } },
        user2: { include: { profile: true } }
      }
    })

    if (!couple) {
      return NextResponse.json(null)
    }

    const partnerId = couple.user1Id === user.userId ? couple.user2Id : couple.user1Id
    const partner = couple.user1Id === user.userId ? couple.user2 : couple.user1

    return NextResponse.json({
      ...couple,
      partnerId,
      partnerName: partner.profile?.displayName || 'Partner',
      isComplete: couple.user1Id !== couple.user2Id
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}