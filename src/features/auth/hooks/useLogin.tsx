'use client'
import { ChangeEvent, FormEvent, useState } from 'react'
import { env } from '@/config/env'
import { toast } from 'sonner'
import { JSON_HEADERS } from '@/shared/constants'
import Link from 'next/link'
import { LOGOUT_REASONS, type LogoutReason } from '@/features/auth/utils/logoutReason'

const LOGOUT_REASON_MESSAGES: Record<LogoutReason, string> = {
  [LOGOUT_REASONS.policyRejected]: 'You must accept the policies to access the system',
  [LOGOUT_REASONS.inactive]:
    'Your account is not active. Contact your organization administrator to restore your access.',
  [LOGOUT_REASONS.noUnitAccess]:
    'Your account is not assigned to any unit, or your unit access has expired. Contact your organization administrator to get access.',
}

const HTTP_BAD_REQUEST = 400
const HTTP_UNAUTHORIZED = 401

const SIGN_IN_UNAVAILABLE =
  'We could not reach StyreIQ to sign you in. Check your connection and try again in a few minutes.'

const showInvalidCredentialsToast = () =>
  toast.custom((t) => (
    <div
      role="status"
      aria-live="polite"
      className="p-4 bg-red-100 rounded-md shadow text-sm border border-red-200"
    >
      <p className="font-semibold text-red-800">Sign-in failed</p>
      <p className="mt-2 text-red-700">
        We couldn&apos;t sign you in with those credentials. If you&apos;ve forgotten your password,
        you can{' '}
        <Link
          href="/forgot-password"
          className="text-red-900 underline font-medium"
          onClick={() => toast.dismiss(t)}
        >
          reset it here
        </Link>
        .
      </p>
    </div>
  ))

export function useLogin(logoutReason?: LogoutReason) {
  const [activeReason, setActiveReason] = useState(logoutReason)
  const logoutMessage = activeReason ? LOGOUT_REASON_MESSAGES[activeReason] : undefined

  const [loginFields, setLoginFields] = useState({
    email: '',
    password: '',
  })

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target
    setLoginFields({ ...loginFields, [name]: value })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // The banner explains the previous session end; a new attempt gets its own feedback.
    setActiveReason(undefined)
    window.history.replaceState(null, '', '/login')

    try {
      const res = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users/login`, {
        method: 'POST',
        credentials: 'include',
        headers: JSON_HEADERS,
        body: JSON.stringify(loginFields),
        cache: 'no-store',
      })

      if (!res.ok) {
        const data: { errors?: { message: string }[] } = await res.json()

        const lockedError = data.errors?.find((err) =>
          err.message.includes('locked due to having too many failed login attempts'),
        )

        if (lockedError) {
          toast.custom((t) => (
            <div
              role="status"
              aria-live="polite"
              className="p-4 bg-red-100 rounded-md shadow text-sm"
            >
              <p className="font-semibold text-red-700">
                Your account is locked for 10 minutes due to too many failed login attempts.
              </p>
              <p className="mt-2">
                If you forgot your password, you can{' '}
                <Link
                  href="/forgot-password"
                  className="text-blue-600 underline"
                  onClick={() => toast.dismiss(t)}
                >
                  reset it here
                </Link>
                .
              </p>
            </div>
          ))
          return
        }

        if (res.status === HTTP_UNAUTHORIZED || res.status === HTTP_BAD_REQUEST) {
          showInvalidCredentialsToast()
          return
        }

        toast.error(SIGN_IN_UNAVAILABLE)
        return
      }

      window.location.href = '/dashboard'
    } catch {
      toast.error(SIGN_IN_UNAVAILABLE)
    }
  }

  return {
    loginFields,
    logoutMessage,
    handleInputChange,
    handleSubmit,
  }
}
