'use client'
import { useState, useEffect } from 'react'

interface TenantMetrics {
  totalUsers: number
  totalUnits: number
  totalTasks: number
  completedTasks: number
  completionRate: number
}

interface UseTenantMetricsResult {
  data: TenantMetrics | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTenantMetrics(tenantId: number | null): UseTenantMetricsResult {
  const [data, setData] = useState<TenantMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tenants/${tenantId}/metrics`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  return { data, isLoading, error, refetch: fetchMetrics }
}
