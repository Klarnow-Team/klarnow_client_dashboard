'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import GrowthKitBuildTracker from '@/components/growth-kit/BuildTracker'

export default function GrowthKitBuildTrackerPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useMockAuth()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.kitType !== 'GROWTH')) {
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

  if (!isAuthenticated || user?.kitType !== 'GROWTH') {
    return null
  }

  // Check if onboarding is complete
  const checkOnboardingComplete = (): boolean => {
    if (typeof window === 'undefined') return false
    try {
      const onboardingData = localStorage.getItem('onboarding_GROWTH')
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
        title: 'Strategy locked in',
        subtitle: 'Offer, goal and funnel map agreed.',
        day_range: 'Days 0-2',
        status: 'NOT_STARTED' as const,
        started_at: null,
        completed_at: null,
        created_at: now,
        updated_at: now,
        checklist: [
          createChecklistItem('1', 'PHASE_1', 'Onboarding complete', isOnboardingComplete, 1),
          createChecklistItem('2', 'PHASE_1', 'Strategy / funnel call done', false, 2),
          createChecklistItem('3', 'PHASE_1', 'Main offer + 90 day goal confirmed', false, 3),
          createChecklistItem('4', 'PHASE_1', 'Simple funnel map agreed', false, 4),
        ],
        links: []
      },
      {
        id: 'phase-2',
        project_id: 'mock-project',
        phase_number: 2,
        phase_id: 'PHASE_2',
        title: 'Copy & email engine',
        subtitle: 'We write your site copy and 5 emails.',
        day_range: 'Days 3-5',
        status: 'NOT_STARTED' as const,
        started_at: null,
        completed_at: null,
        created_at: now,
        updated_at: now,
        checklist: [
          createChecklistItem('5', 'PHASE_2', 'Draft website copy ready', false, 1),
          createChecklistItem('6', 'PHASE_2', 'Draft 5-email nurture sequence ready', false, 2),
          createChecklistItem('7', 'PHASE_2', 'You reviewed and approved copy', false, 3),
          createChecklistItem('8', 'PHASE_2', 'Any changes locked in', false, 4),
        ],
        links: []
      },
      {
        id: 'phase-3',
        project_id: 'mock-project',
        phase_number: 3,
        phase_id: 'PHASE_3',
        title: 'Build the funnel',
        subtitle: 'Pages, lead magnet and blog hub built.',
        day_range: 'Days 6-10',
        status: 'NOT_STARTED' as const,
        started_at: null,
        completed_at: null,
        created_at: now,
        updated_at: now,
        checklist: [
          createChecklistItem('9', 'PHASE_3', '4-6 page site built on staging', false, 1),
          createChecklistItem('10', 'PHASE_3', 'Lead magnet page + thank you page built', false, 2),
          createChecklistItem('11', 'PHASE_3', 'Opt-in forms wired to email platform', false, 3),
          createChecklistItem('12', 'PHASE_3', 'Blog hub and 1-2 starter posts set up', false, 4),
          createChecklistItem('13', 'PHASE_3', 'Staging link shared', false, 5),
        ],
        links: []
      },
      {
        id: 'phase-4',
        project_id: 'mock-project',
        phase_number: 4,
        phase_id: 'PHASE_4',
        title: 'Test & handover',
        subtitle: 'We test the full journey and go live.',
        day_range: 'Days 11-14',
        status: 'NOT_STARTED' as const,
        started_at: null,
        completed_at: null,
        created_at: now,
        updated_at: now,
        checklist: [
          createChecklistItem('14', 'PHASE_4', 'Funnel tested from first visit to booked call', false, 1),
          createChecklistItem('15', 'PHASE_4', 'Domain connected', false, 2),
          createChecklistItem('16', 'PHASE_4', 'Tracking checked (Analytics / pixels)', false, 3),
          createChecklistItem('17', 'PHASE_4', '5-email sequence switched on', false, 4),
          createChecklistItem('18', 'PHASE_4', 'Loom walkthrough recorded and shared', false, 5),
        ],
        links: []
      },
    ]
  }

  const phases = getMockPhases()

  const getMockProject = () => {
    return {
      next_from_us: null,
      next_from_you: null,
    }
  }

  const project = getMockProject()

  return (
    <DashboardLayout>
      <GrowthKitBuildTracker phases={phases} project={project} />
    </DashboardLayout>
  )
}

