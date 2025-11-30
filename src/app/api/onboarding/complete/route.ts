import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

interface OnboardingStep {
  step_number: number
  title: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE'
  required_fields_total: number
  required_fields_completed: number
  time_estimate: string
  fields: Record<string, any>
  started_at: string | null
  completed_at: string | null
}

interface CompleteOnboardingRequest {
  email: string
  kit_type: 'LAUNCH' | 'GROWTH'
  steps: OnboardingStep[]
}

/**
 * POST /api/onboarding/complete
 * Saves all 3 onboarding steps to Supabase when Step 3 is completed
 */
export async function POST(request: Request) {
  try {
    const body: CompleteOnboardingRequest = await request.json()
    const { email, kit_type, steps } = body

    // Validate input
    if (!email || !kit_type || !steps) {
      return NextResponse.json(
        { error: 'Email, kit_type, and steps are required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(steps) || steps.length !== 3) {
      return NextResponse.json(
        { error: 'Exactly 3 steps are required' },
        { status: 400 }
      )
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const emailLower = email.toLowerCase().trim()

    // Get or create project
    let project
    console.log('[Onboarding Complete] Checking for existing project...')
    const { data: existingProject, error: checkError } = await supabaseAdmin
      .from('projects')
      .select('id, onboarding_percent')
      .eq('email', emailLower)
      .eq('kit_type', kit_type)
      .maybeSingle()

    // Check if error is about table/column not existing
    if (checkError && (
      checkError.message?.includes('column') ||
      checkError.message?.includes('relation') ||
      checkError.message?.includes('schema cache') ||
      checkError.message?.includes('does not exist')
    )) {
      return NextResponse.json({
        error: 'Database schema not set up. Please run the migrations to create the projects table.',
        details: checkError.message,
        hint: 'Run the SQL in supabase/migrations/create_onboarding_tables.sql in your Supabase SQL editor'
      }, { status: 500 })
    }

    if (existingProject) {
      console.log('[Onboarding Complete] Using existing project:', existingProject.id)
      project = existingProject
    } else {
      // Create new project
      console.log('[Onboarding Complete] Creating new project...')
      const { data: newProject, error: projectError } = await supabaseAdmin
        .from('projects')
        .insert({
          email: emailLower,
          kit_type,
          onboarding_percent: 0,
          onboarding_finished: false
        })
        .select('id')
        .single()

      if (projectError) {
        console.error('[Onboarding Complete] Error creating project:', projectError)
        if (projectError.message?.includes('column') || projectError.message?.includes('schema cache')) {
          return NextResponse.json({
            error: 'Database schema not set up. The projects table is missing columns.',
            details: projectError.message,
            hint: 'Run the SQL in supabase/migrations/create_onboarding_tables.sql in your Supabase SQL editor'
          }, { status: 500 })
        }
        return NextResponse.json({
          error: `Failed to create project: ${projectError.message}`,
          details: projectError
        }, { status: 500 })
      }

      if (!newProject) {
        return NextResponse.json({
          error: 'Failed to create project: No data returned'
        }, { status: 500 })
      }

      project = newProject
      console.log('[Onboarding Complete] Project created:', project.id)
    }

    // Calculate total onboarding percent from all steps
    const totalRequiredFields = steps.reduce((sum, step) => sum + step.required_fields_total, 0)
    const totalCompletedFields = steps.reduce((sum, step) => sum + step.required_fields_completed, 0)
    const onboardingPercent = totalRequiredFields > 0
      ? Math.round((totalCompletedFields / totalRequiredFields) * 100)
      : 0

    // Save or update each step
    const savedSteps = []
    for (const step of steps) {
      // Check if step already exists
      const { data: existingStep, error: stepCheckError } = await supabaseAdmin
        .from('onboarding_steps')
        .select('id')
        .eq('project_id', project.id)
        .eq('step_number', step.step_number)
        .maybeSingle()

      if (stepCheckError && (
        stepCheckError.message?.includes('relation') ||
        stepCheckError.message?.includes('schema cache') ||
        stepCheckError.message?.includes('does not exist')
      )) {
        return NextResponse.json({
          error: 'Database schema not set up. The onboarding_steps table does not exist.',
          details: stepCheckError.message,
          hint: 'Run the SQL in supabase/migrations/create_onboarding_tables.sql in your Supabase SQL editor'
        }, { status: 500 })
      }

      let savedStep
      if (existingStep) {
        // Update existing step
        console.log(`[Onboarding Complete] Updating step ${step.step_number}...`)
        const { data: updatedStep, error: updateError } = await supabaseAdmin
          .from('onboarding_steps')
          .update({
            title: step.title,
            status: step.status,
            required_fields_total: step.required_fields_total,
            required_fields_completed: step.required_fields_completed,
            time_estimate: step.time_estimate,
            fields: step.fields,
            started_at: step.started_at || new Date().toISOString(),
            completed_at: step.completed_at || (step.status === 'DONE' ? new Date().toISOString() : null),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStep.id)
          .select()
          .single()

        if (updateError) {
          console.error(`[Onboarding Complete] Error updating step ${step.step_number}:`, updateError)
          return NextResponse.json({
            error: `Failed to update step ${step.step_number}: ${updateError.message}`,
            details: updateError
          }, { status: 500 })
        }

        savedStep = updatedStep
      } else {
        // Create new step
        console.log(`[Onboarding Complete] Creating step ${step.step_number}...`)
        const { data: newStep, error: stepError } = await supabaseAdmin
          .from('onboarding_steps')
          .insert({
            project_id: project.id,
            step_number: step.step_number,
            title: step.title,
            status: step.status,
            required_fields_total: step.required_fields_total,
            required_fields_completed: step.required_fields_completed,
            time_estimate: step.time_estimate,
            fields: step.fields,
            started_at: step.started_at || new Date().toISOString(),
            completed_at: step.completed_at || (step.status === 'DONE' ? new Date().toISOString() : null)
          })
          .select()
          .single()

        if (stepError) {
          console.error(`[Onboarding Complete] Error creating step ${step.step_number}:`, stepError)
          if (stepError.message?.includes('relation') || stepError.message?.includes('schema cache')) {
            return NextResponse.json({
              error: 'Database schema not set up. The onboarding_steps table does not exist.',
              details: stepError.message,
              hint: 'Run the SQL in supabase/migrations/create_onboarding_tables.sql in your Supabase SQL editor'
            }, { status: 500 })
          }
          return NextResponse.json({
            error: `Failed to create step ${step.step_number}: ${stepError.message}`,
            details: stepError
          }, { status: 500 })
        }

        if (!newStep) {
          return NextResponse.json({
            error: `Failed to create step ${step.step_number}: No data returned`
          }, { status: 500 })
        }

        savedStep = newStep
      }

      savedSteps.push(savedStep)
    }

    // Update project with final status
    console.log('[Onboarding Complete] Updating project with final status...')
    const { error: updateProjectError } = await supabaseAdmin
      .from('projects')
      .update({
        onboarding_percent: onboardingPercent,
        onboarding_finished: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', project.id)

    if (updateProjectError) {
      console.error('[Onboarding Complete] Error updating project:', updateProjectError)
      // Don't fail the request - steps are already saved
      console.warn('[Onboarding Complete] Steps saved but project update failed')
    }

    console.log('[Onboarding Complete] Onboarding saved successfully!')
    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        email: emailLower,
        kit_type,
        onboarding_percent: onboardingPercent,
        onboarding_finished: true
      },
      steps: savedSteps
    })
  } catch (error: any) {
    console.error('[Onboarding Complete] Unexpected error:', error)
    console.error('[Onboarding Complete] Error stack:', error.stack)
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

