import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { getCurrentOccasions } from '@/lib/occasions'

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

    if (!couple || couple.user1Id === couple.user2Id) {
      return NextResponse.json(null)
    }

    const today = new Date().toISOString().split('T')[0]

    let dailyQuestion = await prisma.dailyQuestion.findUnique({
      where: {
        coupleId_date: {
          coupleId: couple.id,
          date: today
        }
      },
      include: {
        question: true,
        responses: true
      }
    })

    if (!dailyQuestion) {
      // Get user profiles for occasion detection
      const userProfile = couple.user1Id === user.userId ? couple.user1.profile : couple.user2.profile
      const partnerProfile = couple.user1Id === user.userId ? couple.user2.profile : couple.user1.profile
      
      // Detect current occasions
      const occasions = getCurrentOccasions(
        userProfile?.birthday,
        partnerProfile?.birthday,
        couple.anniversaryDate,
        userProfile?.religion
      )

      // Get questions based on occasions or regular questions
      let questions
      if (occasions.length > 0) {
        questions = await prisma.question.findMany({
          where: {
            isActive: true,
            module: 'daily',
            occasion: { in: occasions }
          }
        })
        
        // Fallback to regular questions if no occasion questions found
        if (questions.length === 0) {
          questions = await prisma.question.findMany({
            where: {
              isActive: true,
              module: 'daily',
              occasion: null
            }
          })
        }
      } else {
        questions = await prisma.question.findMany({
          where: {
            isActive: true,
            module: 'daily',
            occasion: null
          }
        })
      }

      if (questions.length === 0) {
        return NextResponse.json(null)
      }

      const randomQuestion = questions[Math.floor(Math.random() * questions.length)]

      dailyQuestion = await prisma.dailyQuestion.create({
        data: {
          coupleId: couple.id,
          questionId: randomQuestion.id,
          date: today,
          isCompleted: false,
          xpAwarded: 0
        },
        include: {
          question: true,
          responses: true
        }
      })
    }

    const userResponse = dailyQuestion.responses.find(r => r.userId === user.userId)
    const partnerId = couple.user1Id === user.userId ? couple.user2Id : couple.user1Id
    const partnerResponse = dailyQuestion.responses.find(r => r.userId === partnerId)
    const bothAnswered = userResponse && partnerResponse

    return NextResponse.json({
      ...dailyQuestion,
      userHasAnswered: !!userResponse,
      partnerHasAnswered: !!partnerResponse,
      bothAnswered,
      userAnswer: bothAnswered ? userResponse?.answer : null,
      partnerAnswer: bothAnswered ? partnerResponse?.answer : null
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}