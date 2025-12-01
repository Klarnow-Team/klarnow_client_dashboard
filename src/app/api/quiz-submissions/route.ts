import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET endpoint to fetch all quiz submissions (admin only - skip admin check for now)
export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const kitType = searchParams.get('kit_type') as 'LAUNCH' | 'GROWTH' | null
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where = kitType ? { preferredKit: kitType } : {}

    // Fetch submissions with Prisma
    const [submissions, total] = await Promise.all([
      prisma.quizSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.quizSubmission.count({ where })
    ])

    return NextResponse.json({
      submissions: submissions.map(s => ({
        id: s.id,
        full_name: s.fullName,
        email: s.email,
        phone_number: s.phoneNumber,
        brand_name: s.brandName,
        logo_status: s.logoStatus,
        brand_goals: s.brandGoals,
        online_presence: s.onlinePresence,
        audience: s.audience,
        brand_style: s.brandStyle,
        timeline: s.timeline,
        preferred_kit: s.preferredKit,
        created_at: s.createdAt.toISOString(),
        updated_at: s.updatedAt.toISOString()
      })),
      total,
      limit,
      offset: skip
    })
  } catch (error: any) {
    console.error('Quiz submissions fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint to create a new quiz submission (public)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      full_name, 
      email, 
      phone_number, 
      brand_name, 
      logo_status, 
      brand_goals, 
      online_presence, 
      audience, 
      brand_style, 
      timeline, 
      preferred_kit 
    } = body

    if (!email || !full_name || !brand_name || !logo_status || !online_presence || !brand_style || !timeline) {
      return NextResponse.json(
        { error: 'Missing required fields: email, full_name, brand_name, logo_status, online_presence, brand_style, timeline are required' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()
    const preferredKit = preferred_kit?.toUpperCase().trim() as 'LAUNCH' | 'GROWTH' | null

    const submission = await prisma.quizSubmission.create({
      data: {
        fullName: full_name,
        email: emailLower,
        phoneNumber: phone_number || null,
        brandName: brand_name,
        logoStatus: logo_status,
        brandGoals: brand_goals || [],
        onlinePresence: online_presence,
        audience: audience || [],
        brandStyle: brand_style,
        timeline,
        preferredKit: preferredKit && (preferredKit === 'LAUNCH' || preferredKit === 'GROWTH') ? preferredKit : null
      }
    })

    return NextResponse.json({ 
      success: true, 
      submission: {
        id: submission.id,
        full_name: submission.fullName,
        email: submission.email,
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
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Quiz submission creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

