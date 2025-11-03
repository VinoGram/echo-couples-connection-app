import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const depth = searchParams.get('depth')

    const questions = await prisma.question.findMany({
      where: {
        isActive: true,
        module: 'questions_bank',
        ...(category && { category }),
        ...(depth && { depth })
      },
      orderBy: { id: 'asc' }
    })

    return NextResponse.json(questions)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}