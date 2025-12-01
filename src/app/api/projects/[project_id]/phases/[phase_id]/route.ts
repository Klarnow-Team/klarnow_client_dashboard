import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/utils/auth'

/**
 * PATCH /api/projects/[project_id]/phases/[phase_id]
 * Update phase status and timestamps.
 * 
 * Request Body:
 * {
 *   status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'DONE',
 *   started_at?: string (ISO timestamp),
 *   completed_at?: string (ISO timestamp)
 * }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ project_id: string; phase_id: string }> }
) {
  try {
    const { project_id, phase_id } = await params
    const body = await request.json()
    
    // Basic auth check
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: project_id }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Get current phase state
    const currentPhaseState = await prisma.clientPhaseState.findUnique({
      where: {
        clientId_phaseId: {
          clientId: project_id,
          phaseId: phase_id
        }
      }
    })

    // Prepare update data
    const updateData: any = {}

    if (body.status !== undefined) {
      updateData.status = body.status
      
      // Auto-update timestamps based on status
      if (body.status === 'IN_PROGRESS' && !body.started_at) {
        if (!currentPhaseState?.startedAt) {
          updateData.startedAt = new Date()
        }
      } else if (body.status === 'DONE' && !body.completed_at) {
        updateData.completedAt = new Date()
      } else if (body.status === 'NOT_STARTED') {
        updateData.startedAt = null
        updateData.completedAt = null
      }
    }

    // Allow manual override of timestamps
    if (body.started_at !== undefined) {
      updateData.startedAt = body.started_at ? new Date(body.started_at) : null
    }
    if (body.completed_at !== undefined) {
      updateData.completedAt = body.completed_at ? new Date(body.completed_at) : null
    }

    // Upsert phase state
    const updatedPhaseState = await prisma.clientPhaseState.upsert({
      where: {
        clientId_phaseId: {
          clientId: project_id,
          phaseId: phase_id
        }
      },
      update: updateData,
      create: {
        clientId: project_id,
        phaseId: phase_id,
        status: body.status || 'NOT_STARTED',
        checklist: {},
        startedAt: body.started_at ? new Date(body.started_at) : (body.status === 'IN_PROGRESS' ? new Date() : null),
        completedAt: body.completed_at ? new Date(body.completed_at) : (body.status === 'DONE' ? new Date() : null)
      }
    })

    return NextResponse.json({
      phase: {
        phase_id: updatedPhaseState.phaseId,
        status: updatedPhaseState.status,
        started_at: updatedPhaseState.startedAt?.toISOString() || null,
        completed_at: updatedPhaseState.completedAt?.toISOString() || null
      },
      message: 'Phase updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating phase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

