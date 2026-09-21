'use client'
import { useState } from 'react'
import { LOGOUT_REASON_PARAM, type LogoutReason } from '@/features/auth/utils/logoutReason'

export const LOGOUT_ROUTE = '/api/logout'

// Full navigation instead of router.push: the route handler clears the auth cookies and
// redirects, and only a hard load drops the client router cache and in-memory session state.
// `replace` keeps the logout route out of history so Back does not re-run it.
export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logout = (reason?: LogoutReason) => {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    const url = reason ? `${LOGOUT_ROUTE}?${LOGOUT_REASON_PARAM}=${reason}` : LOGOUT_ROUTE
    window.location.replace(url)
  }

  return { logout, isLoggingOut }
}
