import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/utils/auth'

/**
 * GET /api/quiz-submissions/users
 * Fetches unique users from quiz submissions
 * Returns list of users with their submission details
 */
export async function GET(request: Request) {
  try {
    // Basic auth check (admin check can be added later)
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const kitType = searchParams.get('kit_type') as 'LAUNCH' | 'GROWTH' | null
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    if (email) {
      where.email = email.toLowerCase().trim()
    }
    if (kitType) {
      where.preferredKit = kitType
    }

    // Fetch quiz submissions
    const [allSubmissions, total] = await Promise.all([
      prisma.quizSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.quizSubmission.count({ where })
    ])

    // Group by email to get unique users (keep latest submission)
    const userMap = new Map<string, any>()
    
    for (const submission of allSubmissions) {
      const emailLower = submission.email.toLowerCase().trim()
      if (!userMap.has(emailLower)) {
        userMap.set(emailLower, submission)
      }
    }

    // Convert map to array and apply pagination
    const uniqueUsers = Array.from(userMap.values())
      .slice(offset, offset + limit)

    // Enrich users with client information
    const enrichedUsers = await Promise.all(
      uniqueUsers.map(async (submission) => {
        // Check if client exists
        const client = await prisma.client.findFirst({
          where: {
            email: submission.email.toLowerCase()
          }
        })

        return {
          id: submission.id,
          user_uuid: submission.id,
          email: submission.email,
          full_name: submission.fullName,
          phone_number: submission.phoneNumber,
          brand_name: submission.brandName,
          logo_status: submission.logoStatus,
          brand_goals: submission.brandGoals || [],
          online_presence: submission.onlinePresence,
          audience: submission.audience || [],
          brand_style: submission.brandStyle,
          timeline: submission.timeline,
          preferred_kit: submission.preferredKit,
          submission_date: submission.createdAt.toISOString(),
          
          has_project: !!client,
          
          project: client ? {
            id: client.id,
            kit_type: client.plan,
            onboarding_finished: client.onboardingPercent === 100,
            onboarding_percent: client.onboardingPercent
          } : null
        }
      })
    )

    return NextResponse.json({
      users: enrichedUsers,
      total: userMap.size,
      limit,
      offset,
      has_more: offset + limit < userMap.size
    })
  } catch (error: any) {
    console.error('Error fetching users from quiz submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

