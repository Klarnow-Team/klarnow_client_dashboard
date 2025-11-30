'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import GrowthKitContent from '@/components/growth-kit/GrowthKitContent'

export default function GrowthKitPage() {
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

  // Get mock project data from localStorage
  const getMockProject = () => {
    const onboardingData = localStorage.getItem('onboarding_GROWTH')
    if (onboardingData) {
      const onboarding = JSON.parse(onboardingData)
      return {
        id: 'mock-project',
        user_id: 'mock-user',
        kit_type: 'GROWTH' as const,
        onboarding_percent: onboarding.onboarding_percent || 0,
        onboarding_finished: onboarding.onboarding_finished || false,
        current_day_of_14: null,
        next_from_us: null,
        next_from_you: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        onboarding_steps: onboarding.steps || [],
        phases: []
      }
    }
    return {
      id: 'mock-project',
      user_id: 'mock-user',
      kit_type: 'GROWTH' as const,
      onboarding_percent: 0,
      onboarding_finished: false,
      current_day_of_14: null,
      next_from_us: null,
      next_from_you: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      onboarding_steps: [],
      phases: []
    }
  }

  const project = getMockProject()

  return <GrowthKitContent project={project} />
}


