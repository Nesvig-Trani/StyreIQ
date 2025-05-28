'use client'

import { useLogin, LoginForm } from '@/auth'

export default function LoginPage() {
  const { loginFields, handleInputChange, handleSubmit } = useLogin()

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
