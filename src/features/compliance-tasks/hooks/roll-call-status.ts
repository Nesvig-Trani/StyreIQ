'use client'

import { useState, useEffect } from 'react'
import { getRollCallStatus } from '@/sdk/compliance-task'

export interface RollCallStatus {
  hasPending: boolean
  lastCompletedDays: number | null
}

type RollCallStatusResponse = Record<string, RollCallStatus>

export function useRollCallStatus(userIds: number[]) {
  const [statusMap, setStatusMap] = useState<Map<number, RollCallStatus>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadStatus = async () => {
      if (!userIds || userIds.length === 0) {
        setStatusMap(new Map())
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const statusData = (await getRollCallStatus(userIds)) as RollCallStatusResponse

        const newStatusMap = new Map<number, RollCallStatus>(
          Object.entries(statusData).map(([userId, status]) => [Number(userId), status]),
        )

        setStatusMap(newStatusMap)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setStatusMap(new Map())
      } finally {
        setIsLoading(false)
      }
    }

    loadStatus()
  }, [userIds])

  return {
    statusMap,
    isLoading,
    error,
  }
}
