import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/utils/auth'

/**
 * PATCH /api/projects/[project_id]/phases/[phase_id]/checklist/[item_id]
 * Update checklist item status.
 * 
 * Request Body:
 * {
 *   checklist_label: string,
 *   is_done: boolean
 * }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ project_id: string; phase_id: string; item_id: string }> }
) {
  try {
    const { project_id, phase_id } = await params
    const body = await request.json()
    const { checklist_label, is_done } = body
    
    // Basic auth check
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (typeof is_done !== 'boolean' || !checklist_label) {
      return NextResponse.json(
        { error: 'Missing required fields: checklist_label and is_done' },
        { status: 400 }
      )
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

    // Get current phase state
    const currentPhaseState = await prisma.clientPhaseState.findUnique({
      where: {
        clientId_phaseId: {
          clientId: project_id,
          phaseId: phase_id
        }
      }
    })

    // Update checklist
    const currentChecklist = (currentPhaseState?.checklist as Record<string, boolean>) || {}
    const updatedChecklist = {
      ...currentChecklist,
      [checklist_label]: is_done
    }

    // Upsert phase state
    await prisma.clientPhaseState.upsert({
      where: {
        clientId_phaseId: {
          clientId: project_id,
          phaseId: phase_id
        }
      },
      update: {
        checklist: updatedChecklist
      },
      create: {
        clientId: project_id,
        phaseId: phase_id,
        status: 'NOT_STARTED',
        checklist: updatedChecklist
      }
    })

    return NextResponse.json({
      checklist_item: {
        phase_id,
        checklist_label,
        is_done
      },
      message: 'Checklist item updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating checklist item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

