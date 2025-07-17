'use client'
import { ChangeEvent, FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { env } from '@/config/env'
import { toast } from 'sonner'
import { JSON_HEADERS } from '@/shared/constants'
import Link from 'next/link'

export function useLogin() {
  const [loginFields, setLoginFields] = useState({
    email: '',
    password: '',
  })
  const router = useRouter()

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
      })

      if (!res.ok) {
        const data: { errors?: { message: string }[] } = await res.json()

        const lockedError = data.errors?.find((err) =>
          err.message.includes('locked due to having too many failed login attempts'),
        )

        if (lockedError) {
          toast.custom((t) => (
            <div className="p-4 bg-red-100 rounded-md shadow text-sm">
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

      router.push('/dashboard')
    } catch {
      toast.error('Invalid credentials')
    }
  }

  return {
    loginFields,
    handleInputChange,
    handleSubmit,
  }
}
