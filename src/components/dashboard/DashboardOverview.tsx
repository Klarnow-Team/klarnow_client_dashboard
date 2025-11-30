'use client'

import { ProjectWithRelations } from '@/types/project'
import { useRouter } from 'next/navigation'
import DashboardCoursueStyle from './DashboardCoursueStyle'

interface DashboardOverviewProps {
  project: ProjectWithRelations | null
}

export default function DashboardOverview({ project }: DashboardOverviewProps) {
  // Use the new Coursue-style dashboard
  return <DashboardCoursueStyle project={project} />
}

// Keep old component for reference (commented out)
function OldDashboardOverview({ project }: DashboardOverviewProps) {
  const router = useRouter()

  // Get current phase
  const currentPhase = project?.phases?.find((p) => p.status === 'IN_PROGRESS') 
    || project?.phases?.find((p) => p.status === 'WAITING_ON_CLIENT')
    || project?.phases?.filter((p) => p.status === 'DONE').pop() 
    || null

  // Get onboarding steps status
  const onboardingSteps = project?.onboarding_steps || []
  const completedSteps = onboardingSteps.filter(s => s.status === 'DONE').length
  const totalSteps = onboardingSteps.length

  const stats = [
    {
      title: 'Current Phase',
      value: currentPhase?.title || 'Onboarding',
      subtitle: currentPhase?.subtitle || 'Getting started',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      gradient: 'from-amber-50 via-amber-50/50 to-white',
      borderColor: 'border-amber-200/60',
      iconColor: 'text-amber-600',
      hover: 'hover:shadow-lg hover:scale-[1.02]'
    },
    {
      title: 'Onboarding Progress',
      value: `${project?.onboarding_percent || 0}%`,
      subtitle: `${completedSteps} of ${totalSteps} steps complete`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      gradient: 'from-[#8359ee]/10 via-[#8359ee]/5 to-white',
      borderColor: 'border-[#8359ee]/20',
      iconColor: 'text-[#8359ee]',
      hover: 'hover:shadow-lg hover:scale-[1.02]',
      progress: project?.onboarding_percent || 0
    },
    {
      title: 'Project Timeline',
      value: project?.current_day_of_14 ? `Day ${project.current_day_of_14}` : 'Not started',
      subtitle: project?.current_day_of_14 ? 'of 14 days' : 'Project begins after onboarding',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      gradient: 'from-purple-50 via-purple-50/50 to-white',
      borderColor: 'border-purple-200/60',
      iconColor: 'text-purple-600',
      hover: 'hover:shadow-lg hover:scale-[1.02]'
    },
    {
      title: 'Your Kit',
      value: project?.kit_type === 'LAUNCH' ? 'Launch Kit' : 'Growth Kit',
      subtitle: project?.kit_type === 'LAUNCH'
        ? '3 page high trust site'
        : '4-6 page funnel and emails',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      gradient: 'from-teal-50 via-teal-50/50 to-white',
      borderColor: 'border-teal-200/60',
      iconColor: 'text-teal-600',
      hover: 'hover:shadow-lg hover:scale-[1.02]'
    }
  ]

  const actionCards = [
    {
      title: 'Next from us',
      content: project?.next_from_us || 'No updates yet. We\'ll keep you posted!',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      gradient: 'from-green-50 via-green-50/30 to-white',
      borderColor: 'border-green-200/50',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50/40'
    },
    {
      title: 'Next from you',
      content: project?.next_from_you || 'Nothing for now. We\'ll let you know when we need something!',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-blue-50 via-blue-50/30 to-white',
      borderColor: 'border-blue-200/50',
      iconColor: 'text-[#8359ee]',
      bgColor: 'bg-[#8359ee]/10/40'
    }
  ]

  return (
    <div className="min-h-full bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl font-bold text-black tracking-tight">
            Welcome back
          </h1>
          <p className="text-lg text-gray-600">
            Your project with Klarnow in one place
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.title}
              className={`
                group relative overflow-hidden
                rounded-2xl bg-white
                border ${stat.borderColor}
                p-6 shadow-sm
                transition-all duration-300 ease-out
                ${stat.hover}
                animate-in fade-in slide-in-from-bottom-4
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={`mb-4 w-12 h-12 rounded-xl ${stat.bgColor || 'bg-white/60'} flex items-center justify-center ${stat.iconColor} transition-transform duration-300 group-hover:scale-110`}>
                {stat.icon}
              </div>

              {/* Content */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-black">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600">
                  {stat.subtitle}
                </p>
              </div>

              {/* Progress Bar (if applicable) */}
              {stat.progress !== undefined && (
                <div className="mt-4 space-y-2">
                  <div className="h-2 w-full rounded-full bg-white/60 overflow-hidden backdrop-blur-sm">
                    <div
                      className="h-full rounded-full bg-[#8359ee] transition-all duration-500 ease-out"
                      style={{ width: `${stat.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Decorative overlay */}
              <div className="absolute inset-0 bg-white/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {actionCards.map((card, index) => (
            <div
              key={card.title}
              className={`
                group relative overflow-hidden
                rounded-2xl ${card.bgColor || 'bg-white'}
                border ${card.borderColor}
                p-6 shadow-sm
                transition-all duration-300 ease-out
                hover:shadow-lg hover:scale-[1.01]
                animate-in fade-in slide-in-from-bottom-4
              `}
              style={{ animationDelay: `${(index + 4) * 100}ms` }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center ${card.iconColor} transition-transform duration-300 group-hover:scale-110`}>
                  {card.icon}
                </div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  {card.title}
                </h2>
              </div>

              {/* Content */}
              <p className="text-base text-gray-900 leading-relaxed">
                {card.content}
              </p>

              {/* Decorative overlay */}
              <div className="absolute inset-0 bg-white/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        {project && (
          <div className="rounded-2xl bg-white border border-[#8359ee]/20 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-lg font-semibold text-black mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              {project.kit_type === 'LAUNCH' ? (
                <button
                  onClick={() => router.push('/launch-kit')}
                  className="rounded-full bg-[#8359ee] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#8359ee]/90 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Go to Launch Kit
                </button>
              ) : (
                <button
                  onClick={() => router.push('/growth-kit')}
                  className="rounded-full bg-[#8359ee] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#8359ee]/90 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Go to Growth Kit
                </button>
              )}
              {onboardingSteps.some(s => s.status !== 'DONE') && (
                <button
                  onClick={() => {
                    const incompleteStep = onboardingSteps.find(s => s.status !== 'DONE')
                    if (incompleteStep) {
                      router.push(`/${project.kit_type.toLowerCase()}-kit/onboarding/step-${incompleteStep.step_number}`)
                    }
                  }}
                  className="rounded-full border-2 border-[#8359ee]/20 bg-white px-6 py-2.5 text-sm font-semibold text-[#8359ee] hover:bg-[#8359ee]/10 transition-all duration-200 hover:border-[#8359ee]/30"
                >
                  Continue Onboarding
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

