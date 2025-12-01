import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromEmail } from '@/utils/auth'

// GET endpoint to fetch onboarding status by email
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()
    const userId = getUserIdFromEmail(emailLower)

    // Check if client exists (indicates onboarding completion)
    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { userId },
          { email: emailLower }
        ]
      },
      include: {
        onboardingAnswer: true
      }
    })

    if (!client) {
      return NextResponse.json(null)
    }

    return NextResponse.json({
      email: client.email,
      onboarding_finished: client.onboardingPercent === 100,
      kit_type: client.plan,
      onboarding_completed_at: client.onboardingAnswer?.completedAt || null
    })
  } catch (error: any) {
    console.error('Onboarding lookup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint to update onboarding status
export async function POST(request: Request) {
  try {
    const { email, onboarding_finished, kit_type } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()
    const userId = getUserIdFromEmail(emailLower)

    // Update or create client record
    const client = await prisma.client.upsert({
      where: {
        userId_plan: {
          userId,
          plan: kit_type || 'LAUNCH'
        }
      },
      update: {
        onboardingPercent: onboarding_finished ? 100 : 0
      },
      create: {
        userId,
        email: emailLower,
        plan: kit_type || 'LAUNCH',
        onboardingPercent: onboarding_finished ? 100 : 0
      }
    })

    return NextResponse.json({
      email: client.email,
      onboarding_finished: client.onboardingPercent === 100,
      kit_type: client.plan
    })
  } catch (error: any) {
    console.error('Onboarding save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

