import { useEffect, useState } from 'react'
import { Phase } from '@/types/project'

interface UseRealtimePhasesResult {
  phases: Phase[]
  loading: boolean
  error: Error | null
  refreshPhases: () => Promise<void>
}

/**
 * Hook to fetch phases for a project
 * Note: Real-time subscriptions removed. Use polling or manual refresh instead.
 * 
 * @param projectId - The project ID to fetch phases for
 * @returns Phases array, loading state, error state, and manual refresh function
 */
export function useRealtimePhases(projectId: string | null): UseRealtimePhasesResult {
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refreshPhases = async () => {
    if (!projectId) {
      setPhases([])
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/phases`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch phases: ${response.statusText}`)
      }

      const data = await response.json()
      setPhases(data.phases || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching phases:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshPhases()
  }, [projectId])

  return { phases, loading, error, refreshPhases }
}

