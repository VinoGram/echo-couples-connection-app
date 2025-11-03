import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { quizType, results } = await request.json()

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

    const quiz = await prisma.quiz.create({
      data: {
        userId: user.userId,
        coupleId: couple.id,
        quizType,
        results: JSON.stringify(results)
      }
    })

    return NextResponse.json(quiz)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const quizzes = await prisma.quiz.findMany({
      where: { coupleId: couple.id },
      orderBy: { completedAt: 'desc' }
    })

    return NextResponse.json(quizzes)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}