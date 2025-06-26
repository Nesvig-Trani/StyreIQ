import { LoginForm } from '@/auth'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const { user } = await getAuthUser()
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
