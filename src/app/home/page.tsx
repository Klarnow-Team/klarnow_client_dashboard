'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LaunchKitBuildTracker from '@/components/launch-kit/BuildTracker'
import GrowthKitBuildTracker from '@/components/growth-kit/BuildTracker'
import { Phase } from '@/types/project'

export default function HomePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useMockAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-black font-medium">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  // Check if onboarding is complete
  const checkOnboardingComplete = (): boolean => {
    if (typeof window === 'undefined') return false
    try {
      const kitType = user?.kitType || 'LAUNCH'
      const onboardingData = localStorage.getItem(`onboarding_${kitType}`)
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

  // Get mock phases data based on kit type
  const getMockPhases = (): Phase[] => {
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

    if (user.kitType === 'LAUNCH') {
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
    } else {
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
  }

  const phases = getMockPhases()

  // Get project data for next_from_us and next_from_you
  const project = {
    next_from_us: null,
    next_from_you: null,
  }

  return (
    <DashboardLayout>
      {user.kitType === 'LAUNCH' ? (
        <LaunchKitBuildTracker phases={phases} project={project} />
      ) : (
        <GrowthKitBuildTracker phases={phases} project={project} />
      )}
    </DashboardLayout>
  )
}

