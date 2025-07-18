'use client'
import { ChangeEvent, FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { env } from '@/config/env'
import { toast } from 'sonner'
import { JSON_HEADERS } from '@/shared/constants'

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
