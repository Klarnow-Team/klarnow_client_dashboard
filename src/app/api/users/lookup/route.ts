import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserLookupResponse } from '@/types/user'
import { createHash } from 'crypto'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // FIRST: Check quiz_submissions table for the email - REQUIRED for login
    const quizSubmissions = await prisma.quizSubmission.findMany({
      where: { email: emailLower },
      orderBy: { createdAt: 'desc' }
    })

    // If email is not in quiz_submissions, deny login
    if (!quizSubmissions || quizSubmissions.length === 0) {
      return NextResponse.json<UserLookupResponse>({ 
        exists: false,
        error: 'This email is not registered. Please complete the quiz to get access.'
      })
    }

    // Get all unique preferred_kit values from quiz submissions
    const quizKits = quizSubmissions
      .map(q => q.preferredKit)
      .filter((kit): kit is 'LAUNCH' | 'GROWTH' => kit === 'LAUNCH' || kit === 'GROWTH')

    // Get the latest quiz submission for display
    const latestQuizSubmission = quizSubmissions[0]

    // Get userId from email (consistent hash)
    const userId = createHash('sha256').update(emailLower).digest('hex').substring(0, 32)

    // Get all kit types from clients table
    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { userId },
          { email: emailLower }
        ]
      },
      select: {
        plan: true,
        onboardingPercent: true
      }
    })

    const projectKits = clients.map(c => c.plan) as ('LAUNCH' | 'GROWTH')[]
    const onboardingFinished = clients.some(c => c.onboardingPercent === 100) || false

    // Combine all kit types (quiz submissions + clients)
    const allKits = Array.from(new Set([
      ...quizKits,
      ...projectKits
    ])) as ('LAUNCH' | 'GROWTH')[]

    // User exists in quiz_submissions (required for login)
    return NextResponse.json<UserLookupResponse>({
      exists: true,
      name: latestQuizSubmission.fullName,
      kit_type: latestQuizSubmission.preferredKit || allKits[0] || 'LAUNCH',
      available_kit_types: allKits.length > 0 ? allKits : (latestQuizSubmission.preferredKit ? [latestQuizSubmission.preferredKit] : ['LAUNCH']),
      onboarding_finished: onboardingFinished,
      quiz_submission: {
        id: latestQuizSubmission.id,
        uuid: latestQuizSubmission.id,
        full_name: latestQuizSubmission.fullName,
        email: latestQuizSubmission.email,
        phone_number: latestQuizSubmission.phoneNumber,
        brand_name: latestQuizSubmission.brandName,
        logo_status: latestQuizSubmission.logoStatus,
        brand_goals: (latestQuizSubmission.brandGoals as string[]) || [],
        online_presence: latestQuizSubmission.onlinePresence,
        audience: (latestQuizSubmission.audience as string[]) || [],
        brand_style: latestQuizSubmission.brandStyle,
        timeline: latestQuizSubmission.timeline,
        preferred_kit: latestQuizSubmission.preferredKit,
        created_at: latestQuizSubmission.createdAt.toISOString(),
        updated_at: latestQuizSubmission.updatedAt.toISOString()
      }
    })
  } catch (error: any) {
    console.error('User lookup error:', error)
    console.error('User lookup error stack:', error?.stack)
    console.error('User lookup error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      cause: error?.cause
    })
    
    // Handle Prisma connection errors
    if (error?.code === 'P1001' || error?.code === 'P1017') {
      console.error('User lookup: Database connection error')
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: process.env.NODE_ENV === 'development' ? 'Please check your DATABASE_URL configuration' : undefined
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        code: error?.code
      },
      { status: 500 }
    )
  }
}

