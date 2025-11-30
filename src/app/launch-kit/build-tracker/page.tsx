'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LaunchKitBuildTracker from '@/components/launch-kit/BuildTracker'

export default function LaunchKitBuildTrackerPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useMockAuth()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.kitType !== 'LAUNCH')) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-black font-medium">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || user?.kitType !== 'LAUNCH') {
    return null
  }

  // Check if onboarding is complete
  const checkOnboardingComplete = (): boolean => {
    if (typeof window === 'undefined') return false
    try {
      const onboardingData = localStorage.getItem('onboarding_LAUNCH')
      if (onboardingData) {
        const parsed = JSON.parse(onboardingData)
        return parsed.onboarding_finished === true
      }
      const userData = localStorage.getItem('user')
      if (userData) {
        const parsed = JSON.parse(userData)
        return parsed.onboarding_finished === true
      }
    } catch (e) {
      return false
    }
    return false
  }

  const isOnboardingComplete = checkOnboardingComplete()

  // Get mock phases data
  const getMockPhases = () => {
    const now = new Date().toISOString()
    const createChecklistItem = (id: string, phaseId: string, label: string, isDone: boolean, sortOrder: number) => ({
      id,
      phase_id: phaseId,
      label,
      is_done: isDone,
      sort_order: sortOrder,
      created_at: now,
      updated_at: now,
    })

    return [
      {
        id: 'phase-1',
        project_id: 'mock-project',
        phase_number: 1,
        phase_id: 'PHASE_1',
        title: 'Inputs & clarity',
        subtitle: 'Lock the message and plan.',
        day_range: 'Days 0-2',
        status: 'NOT_STARTED' as const,
        started_at: null,
        completed_at: null,
        created_at: now,
        updated_at: now,
        checklist: [
          createChecklistItem('1', 'PHASE_1', 'Onboarding steps completed', isOnboardingComplete, 1),
          createChecklistItem('2', 'PHASE_1', 'Brand / strategy call completed', false, 2),
          createChecklistItem('3', 'PHASE_1', 'Simple 14 day plan agreed', false, 3),
        ],
        links: []
      },
      {
        id: 'phase-2',
        project_id: 'mock-project',
        phase_number: 2,
        phase_id: 'PHASE_2',
        title: 'Words that sell',
        subtitle: 'We write your 3 pages.',
        day_range: 'Days 3-5',
        status: 'NOT_STARTED' as const,
        started_at: null,
        completed_at: null,
        created_at: now,
        updated_at: now,
        checklist: [
          createChecklistItem('4', 'PHASE_2', 'Draft homepage copy ready', false, 1),
          createChecklistItem('5', 'PHASE_2', 'Draft offer / services page ready', false, 2),
          createChecklistItem('6', 'PHASE_2', 'Draft contact / about copy ready', false, 3),
          createChecklistItem('7', 'PHASE_2', 'You reviewed and approved copy', false, 4),
        ],
        links: []
      },
      {
        id: 'phase-3',
        project_id: 'mock-project',
        phase_number: 3,
        phase_id: 'PHASE_3',
        title: 'Design & build',
        subtitle: 'We turn copy into a 3 page site.',
        day_range: 'Days 6-10',
        status: 'NOT_STARTED' as const,
        started_at: null,
        completed_at: null,
        created_at: now,
        updated_at: now,
        checklist: [
          createChecklistItem('8', 'PHASE_3', 'Site layout built for all 3 pages', false, 1),
          createChecklistItem('9', 'PHASE_3', 'Mobile checks done', false, 2),
          createChecklistItem('10', 'PHASE_3', 'Testimonials and proof added', false, 3),
          createChecklistItem('11', 'PHASE_3', 'Staging link shared with you', false, 4),
        ],
        links: []
      },
      {
        id: 'phase-4',
        project_id: 'mock-project',
        phase_number: 4,
        phase_id: 'PHASE_4',
        title: 'Test',
        subtitle: 'We connect domain, test and go live.',
        day_range: 'Days 11-14',
        status: 'NOT_STARTED' as const,
        started_at: null,
        completed_at: null,
        created_at: now,
        updated_at: now,
        checklist: [
          createChecklistItem('12', 'PHASE_4', 'Forms tested', false, 1),
          createChecklistItem('13', 'PHASE_4', 'Domain connected', false, 2),
          createChecklistItem('14', 'PHASE_4', 'Final tweaks applied', false, 3),
          createChecklistItem('15', 'PHASE_4', 'Loom walkthrough recorded and shared', false, 4),
        ],
        links: []
      },
    ]
  }

  const phases = getMockPhases()

  // Get project data for next_from_us and next_from_you
  const getMockProject = () => {
    return {
      next_from_us: null,
      next_from_you: null,
    }
  }

  const project = getMockProject()

  return (
    <DashboardLayout>
      <LaunchKitBuildTracker phases={phases} project={project} />
    </DashboardLayout>
  )
}
