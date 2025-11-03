import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { connectionCode } = await request.json()

    const couple = await prisma.couple.findUnique({
      where: { connectionCode }
    })

    if (!couple) {
      return NextResponse.json({ error: 'Invalid connection code' }, { status: 400 })
    }

    if (couple.user1Id === user.userId) {
      return NextResponse.json({ error: 'Cannot connect to yourself' }, { status: 400 })
    }

    if (couple.user2Id !== couple.user1Id) {
      return NextResponse.json({ error: 'This couple is already complete' }, { status: 400 })
    }

    await prisma.couple.update({
      where: { id: couple.id },
      data: { user2Id: user.userId }
    })

    return NextResponse.json({ coupleId: couple.id })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}