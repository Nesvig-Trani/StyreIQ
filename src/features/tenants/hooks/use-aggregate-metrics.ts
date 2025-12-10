'use client'
import { useState, useEffect } from 'react'

interface AggregateMetrics {
  totalTenants: number
  aggregateMetrics: {
    totalUsers: number
    totalTasks: number
    totalCompletedTasks: number
    averageCompletionRate: number
  }
}

interface UseAggregateMetricsResult {
  data: AggregateMetrics | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAggregateMetrics(): UseAggregateMetricsResult {
  const [data, setData] = useState<AggregateMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tenants/aggregate-metrics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  return { data, isLoading, error, refetch: fetchMetrics }
}
