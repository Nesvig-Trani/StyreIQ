import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRollCallStatus } from '../../hooks/roll-call-status'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})
afterEach(() => vi.unstubAllGlobals())

describe('useRollCallStatus', () => {
  it('should return an empty map without calling the API when there are no users', () => {
    // The hook re-runs whenever the array identity changes, so callers must pass a stable one.
    const noUsers: number[] = []
    const { result } = renderHook(() => useRollCallStatus(noUsers))

    expect(result.current.statusMap.size).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should load the status of every user into a map keyed by user id', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          '7': { hasPending: true, lastCompletedDays: null },
          '8': { hasPending: false, lastCompletedDays: 45 },
        }),
      ),
    )
    const userIds = [7, 8]

    const { result } = renderHook(() => useRollCallStatus(userIds))

    await waitFor(() => expect(result.current.statusMap.size).toBe(2))
    expect(result.current.statusMap.get(7)).toEqual({ hasPending: true, lastCompletedDays: null })
    expect(result.current.statusMap.get(8)).toEqual({ hasPending: false, lastCompletedDays: 45 })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ userIds: [7, 8] })
  })

  it('should expose the error and an empty map when the request fails', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Failed to get Roll Call status: db down' }), {
        status: 500,
      }),
    )
    const userIds = [7]

    const { result } = renderHook(() => useRollCallStatus(userIds))

    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.error?.message).toBe('Failed to get Roll Call status: db down')
    expect(result.current.statusMap.size).toBe(0)
    expect(result.current.isLoading).toBe(false)
  })
})
