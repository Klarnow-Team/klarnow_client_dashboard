'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { initializeMockOnboardingData } from '@/utils/mockData'

export default function InitializeProjectPrompt() {
  const [kitType, setKitType] = useState<'LAUNCH' | 'GROWTH' | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleInitialize = async () => {
    if (!kitType) {
      setError('Please select a kit type')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Initialize mock onboarding data
      initializeMockOnboardingData(kitType as 'LAUNCH' | 'GROWTH')

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      // Redirect directly to the first onboarding step
      if (kitType === 'LAUNCH') {
        router.push('/launch-kit/onboarding/step-1')
      } else {
        router.push('/growth-kit/onboarding/step-1')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize project')
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow">
      <h2 className="text-xl font-semibold text-gray-900">
        Get Started
      </h2>
      <p className="mt-2 text-gray-600">
        Select your kit to begin your onboarding process.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select your kit <span className="text-red-500">*</span>
          </label>
          <select
            value={kitType}
            onChange={(e) => setKitType(e.target.value as 'LAUNCH' | 'GROWTH')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8359ee] focus:ring-[#8359ee] sm:text-sm"
          >
            <option value="">Select a kit...</option>
            <option value="LAUNCH">Launch Kit - 3 page high trust site in 14 days</option>
            <option value="GROWTH">Growth Kit - 4 to 6 page funnel and emails in 14 days</option>
          </select>
        </div>

        <button
          onClick={handleInitialize}
          disabled={isLoading || !kitType}
          className="rounded-md bg-[#8359ee] px-4 py-2 text-sm font-medium text-white hover:bg-[#8359ee]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Initializing...' : 'Start Onboarding'}
        </button>
      </div>
    </div>
  )
}

