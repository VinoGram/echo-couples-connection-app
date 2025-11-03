import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dailyQuestionId, answer } = await request.json()

    const dailyQuestion = await prisma.dailyQuestion.findUnique({
      where: { id: dailyQuestionId },
      include: { couple: true }
    })

    if (!dailyQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    if (dailyQuestion.couple.user1Id !== user.userId && dailyQuestion.couple.user2Id !== user.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const existingResponse = await prisma.response.findFirst({
      where: {
        dailyQuestionId,
        userId: user.userId
      }
    })

    if (existingResponse) {
      return NextResponse.json({ error: 'Already answered' }, { status: 400 })
    }

    await prisma.response.create({
      data: {
        userId: user.userId,
        coupleId: dailyQuestion.coupleId,
        dailyQuestionId,
        answer,
        isPrivate: true
      }
    })

    const partnerId = dailyQuestion.couple.user1Id === user.userId 
      ? dailyQuestion.couple.user2Id 
      : dailyQuestion.couple.user1Id

    const partnerResponse = await prisma.response.findFirst({
      where: {
        dailyQuestionId,
        userId: partnerId
      }
    })

    const bothAnswered = !!partnerResponse

    if (bothAnswered) {
      await prisma.response.updateMany({
        where: { dailyQuestionId },
        data: { isPrivate: false }
      })

      await prisma.dailyQuestion.update({
        where: { id: dailyQuestionId },
        data: { isCompleted: true, xpAwarded: 10 }
      })

      await prisma.couple.update({
        where: { id: dailyQuestion.coupleId },
        data: {
          streak: { increment: 1 },
          totalXP: { increment: 10 },
          level: { increment: Math.floor((dailyQuestion.couple.totalXP + 10) / 100) }
        }
      })
    }

    return NextResponse.json({ success: true, bothAnswered })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}