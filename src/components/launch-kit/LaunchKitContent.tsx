'use client'

import Link from 'next/link'
import { ProjectWithRelations } from '@/types/project'

interface LaunchKitContentProps {
  project: ProjectWithRelations | null
}

export default function LaunchKitContent({ project }: LaunchKitContentProps) {
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-8 shadow">
            <h2 className="text-xl font-semibold text-gray-900">
              No Launch Kit project found
            </h2>
            <p className="mt-2 text-gray-600">
              Your Launch Kit project hasn't been initialized yet.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const steps = project.onboarding_steps || []
  const currentStep = steps.find(s => s.status === 'IN_PROGRESS') || steps.find(s => s.status === 'NOT_STARTED') || steps[0]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Text */}
        <div className="mb-8 rounded-lg bg-[#8359ee]/10 p-6 border-2 border-[#8359ee]/20">
          <p className="text-lg font-medium text-[#8359ee]">
            <strong>Launch Kit:</strong> Klaro will walk you through these steps so we can build your 3 page site in 14 days.
          </p>
        </div>

        {/* Onboarding Wizard Section */}
        <div className="mb-12 rounded-lg bg-white p-8 shadow-md border border-gray-100">
          <h2 className="mb-6 text-2xl font-bold text-black">Onboarding</h2>
          
          {/* Step Strip */}
          <div className="mb-6 flex space-x-4">
            {steps.map((step, index) => {
              const isLocked = index > 0 && steps[index - 1]?.status !== 'DONE'
              const isActive = step.id === currentStep?.id
              const isComplete = step.status === 'DONE'
              
              return (
                <Link
                  key={step.id}
                  href={`/launch-kit/onboarding/step-${step.step_number}`}
                  className={`flex-1 rounded-lg border-2 p-4 transition-colors ${
                    isLocked
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : isActive
                      ? 'border-[#8359ee] bg-[#8359ee]/10'
                      : isComplete
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault()
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          Step {step.step_number}
                        </span>
                        {isComplete && (
                          <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                            Done
                          </span>
                        )}
                        {isActive && (
                          <span className="rounded-full bg-[#8359ee]/100 px-2 py-0.5 text-xs text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-black">
                        {step.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {step.time_estimate}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Progress Info */}
          <div className="flex items-center justify-between text-sm font-medium text-black">
            <span>
              Step {currentStep?.step_number || 1} of 3 · Onboarding {project.onboarding_percent}% complete
            </span>
          </div>
        </div>

        {/* Build Tracker Section */}
        <div className="rounded-lg bg-white p-8 shadow-md border border-gray-100">
          <h2 className="mb-6 text-2xl font-bold text-black">
            Launch Kit – Build progress (14 days)
          </h2>
          <p className="mb-6 text-base text-black">
            Track your project progress through 4 phases over 14 days.
          </p>
          <Link
            href="/launch-kit/build-tracker"
            className="inline-flex items-center rounded-lg bg-[#8359ee] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#8359ee]/90 transition-all"
          >
            View Build Tracker
          </Link>
        </div>
      </div>
    </div>
  )
}

