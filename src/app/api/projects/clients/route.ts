import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/utils/auth'

/**
 * GET /api/projects/clients
 * Fetches all clients with their information
 * 
 * Query Parameters:
 * - kit_type (optional): Filter by 'LAUNCH' or 'GROWTH'
 * - onboarding_finished (optional): Filter by boolean (true/false)
 * - limit (optional): Number of results (default: 100)
 * - offset (optional): Pagination offset (default: 0)
 */
export async function GET(request: Request) {
  try {
    // Basic auth check
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const kitType = searchParams.get('kit_type') as 'LAUNCH' | 'GROWTH' | null
    const onboardingFinished = searchParams.get('onboarding_finished')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    if (kitType) {
      where.plan = kitType
    }
    if (onboardingFinished !== null) {
      const isFinished = onboardingFinished === 'true'
      where.onboardingPercent = isFinished ? 100 : { not: 100 }
    }

    // Fetch clients
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          onboardingAnswer: true
        }
      }),
      prisma.client.count({ where })
    ])

    // Fetch quiz submissions for names
    const emails = clients.map(c => c.email)
    const quizSubmissions = await prisma.quizSubmission.findMany({
      where: {
        email: { in: emails }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Create email to name map from quiz submissions
    const emailToName = new Map<string, string>()
    quizSubmissions.forEach(submission => {
      const email = submission.email.toLowerCase()
      if (!emailToName.has(email) && submission.fullName) {
        emailToName.set(email, submission.fullName)
      }
    })

    // Format clients response
    const formattedClients = clients.map(client => ({
      project_id: client.id,
      user_id: client.userId,
      email: client.email,
      name: client.name || emailToName.get(client.email.toLowerCase()) || null,
      kit_type: client.plan,
      onboarding_finished: client.onboardingPercent === 100,
      onboarding_percent: client.onboardingPercent,
      current_day_of_14: client.currentDayOf14,
      next_from_us: client.nextFromUs,
      next_from_you: client.nextFromYou,
      created_at: client.createdAt.toISOString(),
      updated_at: client.updatedAt.toISOString()
    }))

    return NextResponse.json({
      clients: formattedClients,
      total,
      count: formattedClients.length,
      limit,
      offset,
      has_more: offset + limit < total
    })
  } catch (error: any) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

