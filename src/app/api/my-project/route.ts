import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ProjectWithMergedPhases } from '@/types/project'
import { getPhaseStructureForKitType, mergePhaseStructureWithState } from '@/lib/phase-structure'
import { getUserFromRequest, getUserIdFromEmail } from '@/utils/auth'

/**
 * GET /api/my-project
 * Fetches the user's project with hardcoded phase structure.
 * No database fetching for phases - uses hardcoded structure from lib/phase-structure.ts
 * 
 * Authentication: Required (user must be logged in)
 * 
 * Response: Project with hardcoded phases merged with phases_state from database
 */
export async function GET(request: Request) {
  try {
    // Get user from request (mock auth - email from header or query param)
    const { searchParams } = new URL(request.url)
    const emailParam = searchParams.get('email')
    
    let userEmail: string | null = null
    let userId: string | null = null

    // Try to get from request headers first
    const userFromHeaders = await getUserFromRequest()
    if (userFromHeaders) {
      userEmail = userFromHeaders.email
      userId = userFromHeaders.userId
    } else if (emailParam) {
      // Fallback to query parameter
      userEmail = emailParam.toLowerCase().trim()
      userId = getUserIdFromEmail(userEmail)
    }

    if (!userEmail || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized - email required' },
        { status: 401 }
      )
    }

    console.log('[API GET /api/my-project] Looking for client with userId:', userId, 'email:', userEmail)

    // Fetch client record by userId or email
    let client = await prisma.client.findFirst({
      where: {
        OR: [
          { userId },
          { email: userEmail }
        ]
      }
    })

    if (!client) {
      console.log('[API GET /api/my-project] No client found')
    } else {
      console.log('[API GET /api/my-project] Found client:', client.id)
    }

    // If no client found, return hardcoded phases based on user's kit type from quiz_submissions
    if (!client) {
      console.log('[API GET /api/my-project] No client found, using hardcoded phases')
      
      // Try to get kit type from quiz_submissions
      let kitType: 'LAUNCH' | 'GROWTH' = 'LAUNCH'
      const quizSubmission = await prisma.quizSubmission.findFirst({
        where: { email: userEmail },
        orderBy: { createdAt: 'desc' }
      })
      
      if (quizSubmission?.preferredKit) {
        kitType = quizSubmission.preferredKit
      }
      
      const structure = getPhaseStructureForKitType(kitType)
      const mergedPhases = mergePhaseStructureWithState(structure, null)
      
      return NextResponse.json({
        project: {
          id: null,
          user_id: userId,
          email: userEmail,
          kit_type: kitType,
          current_day_of_14: null,
          next_from_us: null,
          next_from_you: null,
          onboarding_finished: false,
          onboarding_percent: 0,
          phases_state: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          phases: mergedPhases
        }
      })
    }

    // Determine if onboarding is complete: if client exists, onboarding is done
    const onboardingFinished = !!client

    console.log('[API GET /api/my-project] Client found:', {
      id: client.id,
      plan: client.plan,
      userId: client.userId,
      onboarding_finished: onboardingFinished
    })

    // Fetch phase state from client_phase_state table
    const phaseStates = await prisma.clientPhaseState.findMany({
      where: { clientId: client.id },
      orderBy: { phaseId: 'asc' }
    })

    // Convert phase states to the format expected by mergePhaseStructureWithState
    const phasesState: Record<string, any> = {}
    phaseStates.forEach(ps => {
      phasesState[ps.phaseId] = {
        status: ps.status,
        started_at: ps.startedAt?.toISOString() || null,
        completed_at: ps.completedAt?.toISOString() || null,
        checklist: ps.checklist || {}
      }
    })

    // Use hardcoded phase structure (no database fetching)
    // Merge with phases_state from client_phase_state table
    console.log('[API GET /api/my-project] Using hardcoded phase structure for plan:', client.plan)
    const structure = getPhaseStructureForKitType(client.plan as 'LAUNCH' | 'GROWTH')
    const mergedPhases = mergePhaseStructureWithState(
      structure,
      Object.keys(phasesState).length > 0 ? phasesState : null
    )
    console.log('[API GET /api/my-project] Generated', mergedPhases.length, 'phases from hardcoded structure')

    // Build response in Project format (for backward compatibility)
    const projectWithPhases: ProjectWithMergedPhases = {
      id: client.id,
      user_id: client.userId,
      kit_type: client.plan as 'LAUNCH' | 'GROWTH',
      current_day_of_14: client.currentDayOf14,
      next_from_us: client.nextFromUs,
      next_from_you: client.nextFromYou,
      onboarding_finished: onboardingFinished,
      onboarding_percent: client.onboardingPercent,
      phases_state: Object.keys(phasesState).length > 0 ? phasesState : null,
      created_at: client.createdAt.toISOString(),
      updated_at: client.updatedAt.toISOString(),
      phases: mergedPhases
    }

    console.log('[API GET /api/my-project] Returning project with', projectWithPhases.phases.length, 'phases')

    return NextResponse.json({
      project: projectWithPhases
    })
  } catch (error: any) {
    console.error('[API GET /api/my-project] Error:', error)
    console.error('[API GET /api/my-project] Error stack:', error?.stack)
    console.error('[API GET /api/my-project] Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      cause: error?.cause
    })
    
    // Handle Prisma connection errors
    if (error?.code === 'P1001' || error?.code === 'P1017') {
      console.error('[API GET /api/my-project] Database connection error')
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
