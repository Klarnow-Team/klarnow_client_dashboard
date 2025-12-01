import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPhaseStructureForKitType, mergePhaseStructureWithState } from '@/lib/phase-structure'
import { getUserFromRequest, getUserIdFromEmail } from '@/utils/auth'

/**
 * GET /api/my-project/progress
 * Get calculated progress metrics for easy display.
 * 
 * Authentication: Required
 * 
 * Response: Pre-calculated progress metrics including:
 * - Overall phase progress
 * - Checklist item progress
 * - Current phase information
 * - Next actions
 * - Timeline information
 */
export async function GET(request: Request) {
  try {
    // Get user from request
    const { searchParams } = new URL(request.url)
    const emailParam = searchParams.get('email')
    
    let userEmail: string | null = null
    let userId: string | null = null

    const userFromHeaders = await getUserFromRequest()
    if (userFromHeaders) {
      userEmail = userFromHeaders.email
      userId = userFromHeaders.userId
    } else if (emailParam) {
      userEmail = emailParam.toLowerCase().trim()
      userId = getUserIdFromEmail(userEmail)
    }

    if (!userEmail || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized - email required' },
        { status: 401 }
      )
    }

    // Find user's client
    let client = await prisma.client.findFirst({
      where: {
        OR: [
          { userId },
          { email: userEmail }
        ]
      },
      include: {
        phaseStates: true
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get phase structure and merge with state
    const structure = getPhaseStructureForKitType(client.plan as 'LAUNCH' | 'GROWTH')
    const phasesState: Record<string, any> = {}
    client.phaseStates.forEach(ps => {
      phasesState[ps.phaseId] = {
        status: ps.status,
        started_at: ps.startedAt?.toISOString() || null,
        completed_at: ps.completedAt?.toISOString() || null,
        checklist: ps.checklist || {}
      }
    })
    
    const mergedPhases = mergePhaseStructureWithState(
      structure,
      Object.keys(phasesState).length > 0 ? phasesState : null
    )

    // Calculate overall phase progress
    const totalPhases = mergedPhases.length
    const completedPhases = mergedPhases.filter(p => p.status === 'DONE').length
    const inProgressPhases = mergedPhases.filter(p => p.status === 'IN_PROGRESS').length
    const notStartedPhases = mergedPhases.filter(p => p.status === 'NOT_STARTED').length
    const phaseCompletionPercent = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

    // Calculate checklist progress
    let totalItems = 0
    let completedItems = 0

    mergedPhases.forEach(phase => {
      if (phase.checklist) {
        Object.values(phase.checklist).forEach((item: any) => {
          totalItems++
          if (item.is_done) completedItems++
        })
      }
    })

    const checklistCompletionPercent = totalItems > 0 
      ? Math.round((completedItems / totalItems) * 100 * 10) / 10 
      : 0

    // Find current phase
    const inProgressPhase = mergedPhases.find(p => p.status === 'IN_PROGRESS')
    const waitingPhase = mergedPhases.find(p => p.status === 'WAITING_ON_CLIENT')
    const donePhases = mergedPhases.filter(p => p.status === 'DONE')
      .sort((a, b) => b.phase_number - a.phase_number)
    
    const currentPhase = inProgressPhase || waitingPhase || (donePhases.length > 0 ? donePhases[0] : mergedPhases[0]) || null

    // Calculate current phase checklist completion
    let currentPhaseChecklistCompletion = null
    if (currentPhase && currentPhase.checklist) {
      const phaseItems = Object.values(currentPhase.checklist)
      const phaseCompleted = phaseItems.filter((item: any) => item.is_done).length
      const phaseTotal = phaseItems.length
      const phasePercent = phaseTotal > 0 
        ? Math.round((phaseCompleted / phaseTotal) * 100 * 10) / 10 
        : 0

      currentPhaseChecklistCompletion = {
        completed: phaseCompleted,
        total: phaseTotal,
        percent: phasePercent
      }
    }

    // Timeline information
    const currentDay = client.currentDayOf14 || 0
    const totalDays = 14
    const daysRemaining = Math.max(0, totalDays - currentDay)
    const timelinePercent = Math.round((currentDay / totalDays) * 100 * 10) / 10

    return NextResponse.json({
      overall_progress: {
        total_phases: totalPhases,
        completed_phases: completedPhases,
        in_progress_phases: inProgressPhases,
        not_started_phases: notStartedPhases,
        phase_completion_percent: phaseCompletionPercent
      },
      checklist_progress: {
        total_items: totalItems,
        completed_items: completedItems,
        remaining_items: totalItems - completedItems,
        completion_percent: checklistCompletionPercent
      },
      current_phase: currentPhase ? {
        phase_id: currentPhase.phase_id,
        phase_number: currentPhase.phase_number,
        title: currentPhase.title,
        status: currentPhase.status,
        checklist_completion: currentPhaseChecklistCompletion
      } : null,
      next_actions: {
        from_us: client.nextFromUs,
        from_you: client.nextFromYou
      },
      timeline: {
        current_day: currentDay,
        total_days: totalDays,
        days_remaining: daysRemaining,
        percent_complete: timelinePercent
      }
    })
  } catch (error: any) {
    console.error('[API GET /api/my-project/progress] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

