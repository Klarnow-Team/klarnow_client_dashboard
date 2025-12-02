/**
 * Phase Structure Definitions
 * 
 * This file contains hardcoded phase structures for Launch Kit and Growth Kit.
 * Phase titles, subtitles, day ranges, and checklist labels are defined here.
 * Only status and checklist completion are stored in the database (phases_state JSONB).
 */

import { KitType, MergedPhase } from '@/types/project'

export interface PhaseStructure {
  phase_id: string
  phase_number: number
  title: string
  subtitle: string | null
  day_range: string
  checklist: string[] // Array of checklist item labels
  links?: Array<{
    label: string
    url?: string // Optional, can be added later
  }>
}

export interface PhaseState {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'DONE'
  started_at?: string | null
  completed_at?: string | null
  checklist: Record<string, boolean> // { "label": true/false }
}

// Launch Kit Phase Structure
const LAUNCH_KIT_PHASES: PhaseStructure[] = [
  {
    phase_id: 'PHASE_1',
    phase_number: 1,
    title: 'Inputs & clarity',
    subtitle: 'Lock the message and plan.',
    day_range: 'Days 0-2',
    checklist: [
      'Onboarding steps completed',
      'Brand / strategy call completed',
      'Simple 14 day plan agreed'
    ]
  },
  {
    phase_id: 'PHASE_2',
    phase_number: 2,
    title: 'Words that sell',
    subtitle: 'We write your 3 pages.',
    day_range: 'Days 3-5',
    checklist: [
      'Draft homepage copy ready',
      'Draft offer / services page ready',
      'Draft contact / about copy ready',
      'You reviewed and approved copy'
    ],
    links: [
      { label: 'View copy doc' }
    ]
  },
  {
    phase_id: 'PHASE_3',
    phase_number: 3,
    title: 'Design & build',
    subtitle: 'We turn copy into a 3 page site.',
    day_range: 'Days 6-10',
    checklist: [
      'Site layout built for all 3 pages',
      'Mobile checks done',
      'Testimonials and proof added',
      'Staging link shared with you'
    ],
    links: [
      { label: 'View staging site' }
    ]
  },
  {
    phase_id: 'PHASE_4',
    phase_number: 4,
    title: 'Test & launch',
    subtitle: 'We connect domain, test and go live.',
    day_range: 'Days 11-14',
    checklist: [
      'Forms tested',
      'Domain connected',
      'Final tweaks applied',
      'Loom walkthrough recorded and shared'
    ],
    links: [
      { label: 'View live site' },
      { label: 'Watch Loom walkthrough' }
    ]
  }
]

// Growth Kit Phase Structure
const GROWTH_KIT_PHASES: PhaseStructure[] = [
  {
    phase_id: 'PHASE_1',
    phase_number: 1,
    title: 'Strategy locked in',
    subtitle: 'Offer, goal and funnel map agreed.',
    day_range: 'Days 0-2',
    checklist: [
      'Onboarding complete',
      'Strategy / funnel call done',
      'Main offer + 90 day goal confirmed',
      'Simple funnel map agreed'
    ]
  },
  {
    phase_id: 'PHASE_2',
    phase_number: 2,
    title: 'Copy & email engine',
    subtitle: 'We write your site copy and 5 emails.',
    day_range: 'Days 3-5',
    checklist: [
      'Draft website copy ready',
      'Draft 5-email nurture sequence ready',
      'You reviewed and approved copy',
      'Any changes locked in'
    ],
    links: [
      { label: 'View website copy' },
      { label: 'View email sequence' }
    ]
  },
  {
    phase_id: 'PHASE_3',
    phase_number: 3,
    title: 'Build the funnel',
    subtitle: 'Pages, lead magnet and blog hub built.',
    day_range: 'Days 6-10',
    checklist: [
      '4-6 page site built on staging',
      'Lead magnet page + thank you page built',
      'Opt-in forms wired to your email platform',
      'Blog hub and 1-2 starter posts set up',
      'Staging link shared'
    ],
    links: [
      { label: 'View staging funnel' }
    ]
  },
  {
    phase_id: 'PHASE_4',
    phase_number: 4,
    title: 'Test & handover',
    subtitle: 'We test the full journey and go live.',
    day_range: 'Days 11-14',
    checklist: [
      'Funnel tested from first visit to booked call',
      'Domain connected',
      'Tracking checked (Analytics / pixels)',
      '5-email sequence switched on',
      'Loom walkthrough recorded and shared'
    ],
    links: [
      { label: 'View live funnel' },
      { label: 'Watch Loom walkthrough' }
    ]
  }
]

/**
 * Get phase structure for a specific kit type
 */
export function getPhaseStructureForKitType(kitType: KitType): PhaseStructure[] {
  return kitType === 'LAUNCH' ? LAUNCH_KIT_PHASES : GROWTH_KIT_PHASES
}

/**
 * Merge hardcoded phase structure with database state
 * Combines structure (titles, labels) with state (status, completion)
 */
export function mergePhaseStructureWithState(
  structure: PhaseStructure[],
  phasesState: Record<string, PhaseState> | null
): MergedPhase[] {
  if (!phasesState) {
    // If no state exists, return structure with default state
    return structure.map(phase => ({
      ...phase,
      status: 'NOT_STARTED',
      started_at: null,
      completed_at: null,
      checklist: phase.checklist.map(label => ({
        label,
        is_done: false
      }))
    }))
  }

  return structure.map(phase => {
    const state = phasesState[phase.phase_id] || {
      status: 'NOT_STARTED' as const,
      checklist: {}
    }

    // Merge checklist: use labels from structure, completion from state
    const mergedChecklist = phase.checklist.map(label => ({
      label,
      is_done: state.checklist[label] || false
    }))

    return {
      ...phase,
      status: state.status || 'NOT_STARTED',
      started_at: state.started_at || null,
      completed_at: state.completed_at || null,
      checklist: mergedChecklist
    }
  })
}

/**
 * Initialize empty phases state from structure
 * Useful for creating initial state when a project is created
 */
export function initializePhasesState(kitType: KitType): Record<string, PhaseState> {
  const structure = getPhaseStructureForKitType(kitType)
  const state: Record<string, PhaseState> = {}

  structure.forEach(phase => {
    const checklistState: Record<string, boolean> = {}
    phase.checklist.forEach(label => {
      checklistState[label] = false
    })

    state[phase.phase_id] = {
      status: 'NOT_STARTED',
      checklist: checklistState
    }
  })

  return state
}

