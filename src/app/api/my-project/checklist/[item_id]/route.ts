import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, getUserIdFromEmail } from '@/utils/auth'
import { validatePhaseId, validateChecklistLabel } from '@/utils/phase-state'

/**
 * PATCH /api/my-project/checklist/[item_id]
 * Updates a single checklist item's completion status.
 * Note: item_id is kept for backward compatibility but phase_id and checklist_label should be in body
 * 
 * Authentication: Required (user must be logged in)
 * 
 * Request Body:
 * {
 *   "phase_id": "PHASE_1",
 *   "checklist_label": "Onboarding steps completed",
 *   "is_done": true
 * }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ item_id: string }> }
) {
  try {
    const body = await request.json()
    const { phase_id, checklist_label, is_done } = body
    const { item_id } = await params

    // Validate request body
    if (typeof is_done !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid field: is_done must be a boolean' },
        { status: 400 }
      )
    }

    if (!phase_id || !checklist_label) {
      return NextResponse.json(
        { error: 'Missing required fields: phase_id and checklist_label' },
        { status: 400 }
      )
    }

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
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find user's client
    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { userId },
          { email: userEmail }
        ]
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Validate phase_id and checklist_label
    const kitType = client.plan as 'LAUNCH' | 'GROWTH'
    if (!validatePhaseId(kitType, phase_id)) {
      return NextResponse.json(
        { error: `Invalid phase_id: ${phase_id}` },
        { status: 400 }
      )
    }

    if (!validateChecklistLabel(kitType, phase_id, checklist_label)) {
      return NextResponse.json(
        { error: `Invalid checklist_label: ${checklist_label} for phase ${phase_id}` },
        { status: 400 }
      )
    }

    // Fetch current phase state
    const currentPhaseState = await prisma.clientPhaseState.findUnique({
      where: {
        clientId_phaseId: {
          clientId: client.id,
          phaseId: phase_id
        }
      }
    })

    // Get or initialize checklist
    const currentChecklist = (currentPhaseState?.checklist as Record<string, boolean>) || {}
    const updatedChecklist = {
      ...currentChecklist,
      [checklist_label]: is_done
    }

    // Determine if we should update status to IN_PROGRESS
    const shouldUpdateToInProgress = is_done && 
      (!currentPhaseState || currentPhaseState.status === 'NOT_STARTED')

    // Upsert phase state
    const updateData: any = {
      checklist: updatedChecklist,
      client: { connect: { id: client.id } }
    }

    if (shouldUpdateToInProgress) {
      updateData.status = 'IN_PROGRESS'
      updateData.startedAt = new Date()
    }

    await prisma.clientPhaseState.upsert({
      where: {
        clientId_phaseId: {
          clientId: client.id,
          phaseId: phase_id
        }
      },
      update: updateData,
      create: {
        clientId: client.id,
        phaseId: phase_id,
        status: shouldUpdateToInProgress ? 'IN_PROGRESS' : 'NOT_STARTED',
        checklist: updatedChecklist,
        startedAt: shouldUpdateToInProgress ? new Date() : null
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
    console.error('[API PATCH /api/my-project/checklist] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

