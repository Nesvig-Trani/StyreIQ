'use client'
import { ChangeEvent, FormEvent, useState } from 'react'
import { env } from '@/config/env'
import { toast } from 'sonner'
import { JSON_HEADERS } from '@/shared/constants'
import Link from 'next/link'

export function useLogin() {
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
            <div role="alert" className="p-4 bg-red-100 rounded-md shadow text-sm">
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

        throw new Error('Failed to login')
      }

      window.location.href = '/dashboard'
    } catch {
      toast.custom((t) => (
        <div
          role="alert"
          className="p-4 bg-red-100 rounded-md shadow text-sm border border-red-200"
        >
          <p className="font-semibold text-red-800">Sign-in failed</p>
          <p className="mt-2 text-red-700">
            We couldn&apos;t sign you in with those credentials. If you&apos;ve forgotten your
            password, you can{' '}
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
    }
  }

  return {
    loginFields,
    handleInputChange,
    handleSubmit,
  }
}
