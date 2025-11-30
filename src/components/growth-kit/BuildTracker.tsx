'use client'

import { useState, useEffect } from 'react'
import { Phase } from '@/types/project'

interface BuildTrackerProps {
  phases: Phase[]
  project: { next_from_us: string | null; next_from_you: string | null }
}

export default function GrowthKitBuildTracker({ phases, project }: BuildTrackerProps) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(() => {
    // Always expand Phase 1 by default
    return 1
  })
  
  // Manage phases state for checklist updates
  const [localPhases, setLocalPhases] = useState<Phase[]>(phases)

  // Load saved checklist state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('build_tracker_checklist_GROWTH')
        if (saved) {
          const savedChecklist = JSON.parse(saved)
          setLocalPhases((prev) =>
            prev.map((phase) => {
              const savedPhase = savedChecklist[phase.phase_number]
              if (savedPhase) {
                return {
                  ...phase,
                  checklist: phase.checklist?.map((item) => {
                    const savedItem = savedPhase.find((s: any) => s.id === item.id)
                    return savedItem ? { ...item, is_done: savedItem.is_done } : item
                  }),
                }
              }
              return phase
            })
          )
        }
      } catch (e) {
        console.error('Error loading checklist state:', e)
      }
    }
  }, [])

  // Toggle checklist item
  const toggleChecklistItem = (phaseNumber: number, itemId: string) => {
    setLocalPhases((prev) => {
      const updated = prev.map((phase) => {
        if (phase.phase_number === phaseNumber) {
          return {
            ...phase,
            checklist: phase.checklist?.map((item) =>
              item.id === itemId ? { ...item, is_done: !item.is_done } : item
            ),
          }
        }
        return phase
      })

      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          const checklistState: Record<number, any[]> = {}
          updated.forEach((phase) => {
            if (phase.checklist) {
              checklistState[phase.phase_number] = phase.checklist.map((item) => ({
                id: item.id,
                is_done: item.is_done,
              }))
            }
          })
          localStorage.setItem('build_tracker_checklist_GROWTH', JSON.stringify(checklistState))
        } catch (e) {
          console.error('Error saving checklist state:', e)
        }
      }

      return updated
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'IN_PROGRESS':
        return 'bg-[#8359ee]/10 text-[#8359ee] border-[#8359ee]/20'
      case 'WAITING_ON_CLIENT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'Done'
      case 'IN_PROGRESS':
        return 'In Progress'
      case 'WAITING_ON_CLIENT':
        return 'Waiting on You'
      default:
        return 'Not Started'
    }
  }

  // Calculate current day and percentage (defaulting to day 1 for now)
  const currentDay = 1 // This should come from project data or be calculated
  const totalDays = 14
  const dayPercentage = Math.round((currentDay / totalDays) * 100)

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-black tracking-tight mb-3">
            Growth Kit
          </h1>
          <p className="text-base text-gray-500 font-light">
            Build progress over 14 days
          </p>
        </div>

        {/* Day Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Day {currentDay} of {totalDays}</span>
            <span className="text-sm font-semibold text-gray-900">{dayPercentage}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8359ee] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${dayPercentage}%` }}
            />
          </div>
        </div>

        {/* Phase Strip */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {localPhases.map((phase, index) => {
            const completedItems = phase.checklist?.filter(item => item.is_done).length || 0
            const totalItems = phase.checklist?.length || 0
            const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
            
            return (
              <button
                key={phase.id}
                onClick={() => setExpandedPhase(expandedPhase === phase.phase_number ? null : phase.phase_number)}
                className={`
                  group relative
                  border border-[#8359ee]/20 border-b-2 border-b-[#8359ee] rounded-lg p-6 text-left
                  transition-all duration-200 ease-out
                  ${
                    expandedPhase === phase.phase_number
                      ? 'bg-gray-50'
                      : phase.status === 'WAITING_ON_CLIENT'
                      ? 'bg-white hover:bg-yellow-50/20'
                      : phase.status === 'IN_PROGRESS'
                      ? 'bg-white hover:bg-[#8359ee]/5'
                      : phase.status === 'DONE'
                      ? 'bg-white hover:bg-green-50/20'
                      : 'bg-white hover:bg-gray-50/50'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Phase {phase.phase_number}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(phase.status)}`}>
                    {getStatusLabel(phase.status)}
                  </span>
                </div>
                
                <h3 className="text-xl font-medium text-black mb-2 leading-tight">{phase.title}</h3>
                <p className="text-sm text-gray-500 mb-3 font-light">{phase.subtitle}</p>
                <p className="text-xs text-gray-400 mb-4">{phase.day_range}</p>
                
                {/* Progress indicator */}
                {totalItems > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-500">{completedItems}/{totalItems} tasks</span>
                    </div>
                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#8359ee] rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Expanded Phase Details */}
        {expandedPhase !== null && (
          <div className="border-t-2 border-gray-200 pt-12 pb-8">
            {(() => {
              const phase = localPhases.find(p => p.phase_number === expandedPhase)
              if (!phase) return null

              const hasActionNeeded = phase.status === 'WAITING_ON_CLIENT' && project.next_from_you

              return (
                <div className="space-y-10">
                  {/* Phase Header */}
                  <div className="pb-8 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Phase {phase.phase_number}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">{phase.day_range}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-black mb-2">{phase.title}</h2>
                        <p className="text-base text-gray-500 font-light">{phase.subtitle}</p>
                      </div>
                      <button
                        onClick={() => setExpandedPhase(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        aria-label="Close phase details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Checklist */}
                    <div className="lg:col-span-2 space-y-8">
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">
                          Checklist
                        </h3>
                        <p className="text-xs text-gray-400 mb-6 -mt-4 font-light italic">
                          Ensure phase has been completed before updating checklist
                        </p>
                        <div className="space-y-2">
                          {phase.checklist?.map((item) => (
                            <div 
                              key={item.id} 
                              className="flex items-start gap-4 py-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150 cursor-pointer group"
                              onClick={() => toggleChecklistItem(phase.phase_number, item.id)}
                            >
                              <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200 mt-0.5 shrink-0 ${
                                item.is_done 
                                  ? 'bg-[#8359ee] border-[#8359ee]' 
                                  : 'border-gray-300 bg-white group-hover:border-gray-400'
                              }`}>
                                {item.is_done && (
                                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-sm flex-1 leading-relaxed ${item.is_done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Links */}
                      {phase.links && phase.links.length > 0 && (
                        <div className="pt-8 border-t border-gray-200">
                          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                            Links
                          </h3>
                          <div className="space-y-2">
                            {phase.links.map((link) => (
                              <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-gray-900 hover:text-gray-600 underline underline-offset-4 transition-colors group"
                              >
                                <span>{link.label}</span>
                                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                </svg>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Next From Us / You */}
                    <div className="space-y-8">
                      <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                          Next from us
                        </h3>
                        <p className="text-sm text-gray-900 leading-relaxed font-light">
                          {project.next_from_us || 'No updates yet. We\'ll keep you posted!'}
                        </p>
                      </div>

                      <div className={`pb-6 ${hasActionNeeded ? 'border-l-4 border-yellow-500 pl-6' : 'border-b border-gray-200'}`}>
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                            Next from you
                          </h3>
                          {hasActionNeeded && (
                            <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                              Action Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 leading-relaxed font-light mb-3">
                          {project.next_from_you || 'Nothing for now. We\'ll let you know when we need something!'}
                        </p>
                        {hasActionNeeded && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-600 mb-2">What to do:</p>
                            <p className="text-sm text-gray-900 leading-relaxed font-light">
                              Please review the checklist items above and complete any actions needed. If you have questions, reach out to us!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

