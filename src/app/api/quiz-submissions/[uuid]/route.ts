import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/utils/auth'

/**
 * GET /api/quiz-submissions/[uuid]
 * Fetches a specific quiz submission by UUID and all related user details
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params
    
    // Basic auth check
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch quiz submission by UUID
    const submission = await prisma.quizSubmission.findUnique({
      where: { id: uuid }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Quiz submission not found' },
        { status: 404 }
      )
    }

    const email = submission.email.toLowerCase().trim()

    // Fetch client if exists
    const client = await prisma.client.findFirst({
      where: {
        email: email
      },
      include: {
        phaseStates: true,
        onboardingAnswer: true
      }
    })

    // Fetch all quiz submissions for this email
    const allSubmissions = await prisma.quizSubmission.findMany({
      where: { email: email },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      submission: {
        id: submission.id,
        uuid: submission.id,
        email: submission.email,
        full_name: submission.fullName,
        phone_number: submission.phoneNumber,
        brand_name: submission.brandName,
        logo_status: submission.logoStatus,
        brand_goals: submission.brandGoals,
        online_presence: submission.onlinePresence,
        audience: submission.audience,
        brand_style: submission.brandStyle,
        timeline: submission.timeline,
        preferred_kit: submission.preferredKit,
        created_at: submission.createdAt.toISOString(),
        updated_at: submission.updatedAt.toISOString()
      },
      project: client ? {
        id: client.id,
        email: client.email,
        plan: client.plan,
        onboarding_percent: client.onboardingPercent,
        next_from_us: client.nextFromUs,
        next_from_you: client.nextFromYou,
        current_day_of_14: client.currentDayOf14
      } : null,
      submission_history: allSubmissions.map(s => ({
        id: s.id,
        email: s.email,
        preferred_kit: s.preferredKit,
        created_at: s.createdAt.toISOString()
      })),
      summary: {
        has_project: !!client,
        total_submissions: allSubmissions.length
      }
    })
  } catch (error: any) {
    console.error('Error fetching quiz submission details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

