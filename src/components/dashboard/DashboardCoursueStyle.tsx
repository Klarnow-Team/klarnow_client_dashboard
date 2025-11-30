'use client'

import { ProjectWithRelations } from '@/types/project'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardCoursueStyleProps {
  project: ProjectWithRelations | null
}

export default function DashboardCoursueStyle({ project }: DashboardCoursueStyleProps) {
  const router = useRouter()

  // Get onboarding steps status
  const onboardingSteps = project?.onboarding_steps || []
  const completedSteps = onboardingSteps.filter(s => s.status === 'DONE').length
  const totalSteps = onboardingSteps.length || 3

  // Get current phase
  const currentPhase = project?.phases?.find((p) => p.status === 'IN_PROGRESS') 
    || project?.phases?.find((p) => p.status === 'WAITING_ON_CLIENT')
    || null

  // Progress cards data
  const progressCards = [
    {
      title: 'Onboarding',
      progress: `${completedSteps}/${totalSteps} completed`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-[#8359ee]/100',
      textColor: 'text-white'
    },
    {
      title: 'Build Progress',
      progress: currentPhase ? `${currentPhase.phase_number}/4 phases` : 'Not started',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      bgColor: 'bg-pink-500',
      textColor: 'text-white'
    },
    {
      title: 'Project Status',
      progress: currentPhase?.title || 'Onboarding',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      bgColor: 'bg-[#8359ee]/100',
      textColor: 'text-white'
    }
  ]

  // Continue working items (onboarding steps)
  const continueItems = onboardingSteps
    .filter(step => step.status !== 'DONE')
    .slice(0, 3)
    .map(step => ({
      id: step.id,
      title: step.title,
      stepNumber: step.step_number,
      kitType: project?.kit_type || 'LAUNCH',
      progress: `${step.required_fields_completed}/${step.required_fields_total}`,
      status: step.status
    }))

  // Your tasks (phases or next actions)
  const tasks = project?.phases?.slice(0, 3).map(phase => ({
    id: phase.id,
    title: phase.title,
    type: 'Phase',
    description: phase.subtitle || phase.day_range || 'Project phase',
    status: phase.status
  })) || []
  
  // If no phases, show onboarding steps as tasks
  const displayTasks = tasks.length > 0 ? tasks : onboardingSteps.slice(0, 3).map(step => ({
    id: step.id,
    title: step.title,
    type: 'Onboarding',
    description: `Step ${step.step_number} of ${totalSteps}`,
    status: step.status
  }))

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-8 text-white">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" fill="none" viewBox="0 0 400 200">
              <path d="M50 50 L100 30 L150 70 L200 40 L250 80 L300 50 L350 90" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
              <circle cx="100" cy="100" r="20" fill="currentColor" opacity="0.3" />
              <circle cx="300" cy="120" r="15" fill="currentColor" opacity="0.3" />
            </svg>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-wider mb-2 opacity-90">
              YOUR PROJECT
            </p>
            <h1 className="text-3xl font-bold mb-4">
              Build Your {project?.kit_type === 'LAUNCH' ? '3-Page Site' : 'Funnel'} in 14 Days
            </h1>
            <p className="text-lg mb-6 opacity-90">
              Complete your onboarding and watch your project come to life
            </p>
            {onboardingSteps.some(s => s.status !== 'DONE') ? (
              <button
                onClick={() => {
                  const incompleteStep = onboardingSteps.find(s => s.status !== 'DONE')
                  if (incompleteStep && project) {
                    router.push(`/${project.kit_type.toLowerCase()}-kit/onboarding/step-${incompleteStep.step_number}`)
                  }
                }}
                className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-900 transition-all duration-200 flex items-center gap-2"
              >
                Continue Onboarding
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (project) {
                    router.push(`/${project.kit_type.toLowerCase()}-kit`)
                  }
                }}
                className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-900 transition-all duration-200 flex items-center gap-2"
              >
                View Project
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {progressCards.map((card, index) => (
            <div
              key={card.title}
              className={`relative overflow-hidden rounded-xl ${card.bgColor} p-5 ${card.textColor} shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center`}>
                  {card.icon}
                </div>
                <button className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-sm font-semibold mb-1">{card.progress}</p>
              <p className="text-base font-bold">{card.title}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Continue Working / Your Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue Working Section */}
            {continueItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-black">Continue Working</h2>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {continueItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => router.push(`/${item.kitType.toLowerCase()}-kit/onboarding/step-${item.stepNumber}`)}
                    >
                      <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-xl bg-[#8359ee] flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <button className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-full transition-colors">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </button>
                      </div>
                      <div className="p-4">
                        <span className="inline-block px-2 py-1 rounded-full bg-[#8359ee]/10 text-indigo-700 text-xs font-semibold mb-2">
                          STEP {item.stepNumber}
                        </span>
                        <h3 className="text-base font-bold text-black mb-1 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.progress} fields completed
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-semibold">K</span>
                          </div>
                          <span>Klarnow Team</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Your Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black">Your Tasks</h2>
                <Link href={project?.kit_type === 'LAUNCH' ? '/launch-kit' : '/growth-kit'} className="text-sm font-semibold text-[#8359ee] hover:text-[#8359ee]/80">
                  See all
                </Link>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Task</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {displayTasks.length > 0 ? (
                        displayTasks.map((task) => (
                          <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-black">{task.title}</div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-block px-2 py-1 rounded-full bg-[#8359ee]/10 text-indigo-700 text-xs font-semibold">
                                {task.type}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-600">{task.description}</div>
                            </td>
                            <td className="px-4 py-4">
                              <button
                                onClick={() => router.push(project?.kit_type === 'LAUNCH' ? '/launch-kit/build-tracker' : '/growth-kit/build-tracker')}
                                className="w-8 h-8 rounded-full bg-[#8359ee] hover:bg-[#8359ee]/90 flex items-center justify-center transition-colors"
                              >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            No tasks available. Complete onboarding to see build phases.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Statistics Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 relative">
              <button className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              {/* Circular Progress */}
              <div className="flex justify-center mb-4">
                <div className="relative w-24 h-24">
                  <svg className="transform -rotate-90 w-24 h-24">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - (project?.onboarding_percent || 0) / 100)}`}
                      className="text-[#8359ee] transition-all duration-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-black">{project?.onboarding_percent || 0}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Greeting */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-black mb-1">
                  Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'} 🔥
                </h3>
                <p className="text-sm text-gray-600">
                  Continue your onboarding to achieve your target!
                </p>
              </div>

              {/* Bar Chart */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-black mb-3">Progress</h4>
                <div className="space-y-3">
                  {['Week 1', 'Week 2'].map((week, index) => {
                    const progress = index === 0 
                      ? Math.min((project?.onboarding_percent || 0) / 2, 50)
                      : Math.max((project?.onboarding_percent || 0) - 50, 0)
                    return (
                      <div key={week}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">{week}</span>
                          <span className="text-xs font-semibold text-black">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#8359ee] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Your Team Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-black">Your Team</h3>
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Project Manager', role: 'PM', avatar: 'PM' },
                  { name: 'Design Team', role: 'Designer', avatar: 'DT' },
                  { name: 'Development Team', role: 'Developer', avatar: 'DV' }
                ].map((member, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-[#8359ee]/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-indigo-700">{member.avatar}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-black">{member.name}</p>
                      <p className="text-xs text-gray-600">{member.role}</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-full bg-[#8359ee]/10 text-indigo-700 text-xs font-semibold hover:bg-[#8359ee]/10 transition-colors">
                      Contact
                    </button>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full text-center text-sm font-semibold text-[#8359ee] hover:text-[#8359ee]/80 py-2">
                See All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

