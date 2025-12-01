'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import { useRealtimeProject } from '@/hooks/useRealtimeProject'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PhaseCard from '@/components/client-dashboard/PhaseCard'
import ExpandedPhaseDetails from '@/components/client-dashboard/ExpandedPhaseDetails'
import { MergedPhase } from '@/types/project'

export default function HomePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useMockAuth()
  const { project, loading: projectLoading, error, refreshProject } = useRealtimeProject()
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
      return
    }
  }, [isAuthenticated, authLoading, router])

  // Set expanded phase when project loads (expand first phase by default)
  useEffect(() => {
    if (project && project.phases && project.phases.length > 0 && expandedPhase === null) {
      // Expand Phase 1 by default
      setExpandedPhase(1)
    }
  }, [project, expandedPhase])

  const handleChecklistUpdate = async (
    phaseId: string,
    checklistLabel: string,
    isDone: boolean
  ) => {
    if (!project || !project.phases || !user?.email) {
      console.error('Project, phases, or user email not available')
      return
    }

    const updateKey = `${phaseId}-${checklistLabel}`
    setUpdatingItems(prev => new Set(prev).add(updateKey))

    try {
      console.log('[HomePage] Updating checklist item:', { phaseId, checklistLabel, isDone })
      
      const response = await fetch('/api/my-project/phases', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': user.email
        },
        credentials: 'include',
        body: JSON.stringify({
          phase_id: phaseId,
          checklist_label: checklistLabel,
          is_done: isDone
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[HomePage] API error:', errorData)
        throw new Error(errorData.error || 'Failed to update checklist item')
      }

      // Get the updated project data from the response
      const data = await response.json()
      console.log('[HomePage] Checklist updated successfully in database:', {
        phaseId,
        checklistLabel,
        isDone,
        hasUpdatedProject: !!data.project
      })

      // Immediately refresh to get the latest data from database
      // This ensures the UI shows the updated state right away
      await refreshProject()
    } catch (err) {
      console.error('[HomePage] Error updating checklist item:', err)
      // Refresh to get correct state from server
      await refreshProject()
      alert('Failed to update checklist item. Please try again.')
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev)
        next.delete(updateKey)
        return next
      })
    }
  }

  const handlePhaseCardClick = (phaseNumber: number) => {
    setExpandedPhase(expandedPhase === phaseNumber ? null : phaseNumber)
  }

  if (authLoading || projectLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-black font-medium">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-2">Error loading project</p>
            <p className="text-sm text-gray-500 mb-4">{error.message}</p>
            <button
              onClick={() => refreshProject()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // If project doesn't exist, show loading (it should be found by email)
  // The API will return hardcoded phases even if project doesn't exist
  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-black font-medium">Loading project...</div>
        </div>
      </DashboardLayout>
    )
  }

  // Project already has MergedPhase[] from the API, no transformation needed
  const phases: MergedPhase[] = project.phases || []

  return (
    <DashboardLayout>
      <div className="bg-white min-h-screen">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-black tracking-tight mb-3">
              {project.kit_type === 'GROWTH' ? 'Growth Kit' : project.kit_type === 'LAUNCH' ? 'Launch Kit' : 'Build Progress'}
            </h1>
            <p className="text-base text-gray-500 font-light">
              Build progress over 14 days
            </p>
          </div>

          {/* Day Progress Bar */}
          {project.current_day_of_14 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">
                  Day {project.current_day_of_14} of 14
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round((project.current_day_of_14 / 14) * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8359ee] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.round((project.current_day_of_14 / 14) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Phase Strip - All Phases as Cards */}
          <div className="mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {phases.map((phase) => {
              // Check if previous phase is complete
              const previousPhase = phase.phase_number > 1 
                ? phases.find(p => p.phase_number === phase.phase_number - 1)
                : null
              const isLocked = previousPhase ? previousPhase.status !== 'DONE' : false

              return (
                <PhaseCard
                  key={phase.phase_id}
                  phase={phase}
                  isExpanded={expandedPhase === phase.phase_number}
                  isLocked={isLocked}
                  onClick={() => handlePhaseCardClick(phase.phase_number)}
                />
              )
            })}
          </div>

          {/* Expanded Phase Details */}
          {expandedPhase !== null && (() => {
            const phase = phases.find(p => p.phase_number === expandedPhase)
            if (!phase) return null

            return (
              <ExpandedPhaseDetails
                phase={phase}
                project={project}
                onClose={() => setExpandedPhase(null)}
                onChecklistUpdate={handleChecklistUpdate}
                updatingItems={updatingItems}
              />
            )
          })()}
        </div>
      </div>
    </DashboardLayout>
  )
}
