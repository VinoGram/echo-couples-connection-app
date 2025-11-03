import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

function generateConnectionCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingCouple = await prisma.couple.findFirst({
      where: {
        OR: [
          { user1Id: user.userId },
          { user2Id: user.userId }
        ]
      }
    })

    if (existingCouple) {
      return NextResponse.json({ error: 'User is already in a couple' }, { status: 400 })
    }

    const connectionCode = generateConnectionCode()

    const couple = await prisma.couple.create({
      data: {
        user1Id: user.userId,
        user2Id: user.userId,
        connectionCode,
        streak: 0,
        totalXP: 0,
        level: 1
      }
    })

    return NextResponse.json({ coupleId: couple.id, connectionCode })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}