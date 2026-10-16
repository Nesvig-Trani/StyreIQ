import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { LOGOUT_ROUTE, useLogout } from '../hooks/useLogout'
import { LOGOUT_REASONS } from '../utils/logoutReason'

const replace = vi.fn()

beforeEach(() => {
  replace.mockReset()
  vi.stubGlobal('location', { replace })
})
afterEach(() => vi.unstubAllGlobals())

describe('useLogout', () => {
  it('should navigate to the logout route without a reason', () => {
    const { result } = renderHook(() => useLogout())
    act(() => result.current.logout())
    expect(replace).toHaveBeenCalledWith(LOGOUT_ROUTE)
    expect(result.current.isLoggingOut).toBe(true)
  })

  it('should include the reason when the session ended for a known cause', () => {
    const { result } = renderHook(() => useLogout())
    act(() => result.current.logout(LOGOUT_REASONS.policyRejected))
    expect(replace).toHaveBeenCalledWith('/api/logout?reason=policy-rejected')
  })

  it('should ignore repeated logout calls while one is in progress', () => {
    const { result } = renderHook(() => useLogout())
    act(() => result.current.logout())
    act(() => result.current.logout(LOGOUT_REASONS.inactive))
    expect(replace).toHaveBeenCalledOnce()
  })
})
