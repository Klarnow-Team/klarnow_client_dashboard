import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/utils/auth'
import { getPhaseStructureForKitType, mergePhaseStructureWithState } from '@/lib/phase-structure'

/**
 * GET /api/projects/[project_id]/phases
 * Fetches all phases for a specific project with checklist items.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ project_id: string }> }
) {
  try {
    const { project_id } = await params
    
    // Basic auth check
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch client
    const client = await prisma.client.findUnique({
      where: { id: project_id },
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

    // Generate phases from structure merged with state
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

    return NextResponse.json({
      phases: mergedPhases,
      project_id
    })
  } catch (error: any) {
    console.error('Error fetching phases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

