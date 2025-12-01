import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/utils/auth'

/**
 * PATCH /api/projects/[project_id]
 * Update client fields (current_day_of_14, next_from_us, next_from_you).
 * 
 * Request Body:
 * {
 *   current_day_of_14?: number (1-14),
 *   next_from_us?: string,
 *   next_from_you?: string
 * }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ project_id: string }> }
) {
  try {
    const { project_id } = await params
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

    // Validate current_day_of_14 if provided
    if (body.current_day_of_14 !== undefined) {
      const day = parseInt(String(body.current_day_of_14))
      if (isNaN(day) || day < 1 || day > 14) {
        return NextResponse.json(
          { error: 'current_day_of_14 must be a number between 1 and 14' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}

    if (body.current_day_of_14 !== undefined) {
      updateData.currentDayOf14 = body.current_day_of_14
    }
    if (body.next_from_us !== undefined) {
      updateData.nextFromUs = body.next_from_us
    }
    if (body.next_from_you !== undefined) {
      updateData.nextFromYou = body.next_from_you
    }

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id: project_id },
      data: updateData
    })

    return NextResponse.json({
      project: {
        id: updatedClient.id,
        user_id: updatedClient.userId,
        email: updatedClient.email,
        kit_type: updatedClient.plan,
        current_day_of_14: updatedClient.currentDayOf14,
        next_from_us: updatedClient.nextFromUs,
        next_from_you: updatedClient.nextFromYou,
        onboarding_finished: updatedClient.onboardingPercent === 100,
        onboarding_percent: updatedClient.onboardingPercent,
        created_at: updatedClient.createdAt.toISOString(),
        updated_at: updatedClient.updatedAt.toISOString()
      },
      message: 'Project updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

