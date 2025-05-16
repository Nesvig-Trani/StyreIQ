'use client'

import { LoginForm } from '@/components/login-form'
import { useRouter } from 'next/navigation'
import { ChangeEvent, FormEvent, useState } from 'react'

export default function LoginPage() {
  const [loginFields, setLoginFields] = useState({
    email: 'leider.escobar+1@meltstudio.co',
    password: 'securepassword',
  })
  const router = useRouter()

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log(e.target)
    const { value, name } = e.target
    console.log(value, name)
    setLoginFields({ ...loginFields, [name]: value })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const res = await fetch('http://localhost:3000/api/admins/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginFields),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Login failed')
      }

      const response = await res.json()
      console.log('Login successful', response)

      router.push('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm
          className=""
          loginFields={loginFields}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
