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
      }
    })

    if (!couple) {
      return NextResponse.json([])
    }

    const messages = await prisma.message.findMany({
      where: { coupleId: couple.id },
      include: {
        sender: {
          include: { profile: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    })

    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 })
    }

    const couple = await prisma.couple.findFirst({
      where: {
        OR: [
          { user1Id: user.userId },
          { user2Id: user.userId }
        ]
      }
    })

    if (!couple) {
      return NextResponse.json({ error: 'No couple found' }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        coupleId: couple.id,
        senderId: user.userId,
        content: content.trim()
      },
      include: {
        sender: {
          include: { profile: true }
        }
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}