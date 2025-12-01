import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/utils/auth'
import { getPhaseStructureForKitType, mergePhaseStructureWithState } from '@/lib/phase-structure'

/**
 * GET /api/projects/phases
 * Fetches phases for all projects (admin overview).
 * 
 * Query Parameters:
 * - kit_type (optional): Filter by 'LAUNCH' or 'GROWTH'
 * - status (optional): Filter by phase status
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
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    if (kitType) {
      where.plan = kitType
    }

    // Fetch clients with phase states
    const clients = await prisma.client.findMany({
      where,
      include: {
        phaseStates: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Process clients and generate phases
    const processedProjects = await Promise.all(
      clients.map(async (client) => {
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

        // Filter by status if provided
        let phases = mergedPhases
        if (status) {
          phases = phases.filter(phase => phase.status === status.toUpperCase())
        }

        return {
          id: client.id,
          user_id: client.userId,
          email: client.email,
          kit_type: client.plan,
          current_day_of_14: client.currentDayOf14,
          next_from_us: client.nextFromUs,
          next_from_you: client.nextFromYou,
          onboarding_finished: client.onboardingPercent === 100,
          onboarding_percent: client.onboardingPercent,
          created_at: client.createdAt.toISOString(),
          updated_at: client.updatedAt.toISOString(),
          phases
        }
      })
    ).then(projects => projects.filter(project => {
      // If status filter is applied, only include projects with matching phases
      if (status && (!project.phases || project.phases.length === 0)) {
        return false
      }
      return true
    }))

    const total = await prisma.client.count({ where })

    return NextResponse.json({
      projects: processedProjects,
      total,
      limit,
      offset,
      has_more: offset + limit < total
    })
  } catch (error: any) {
    console.error('Error fetching projects with phases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

