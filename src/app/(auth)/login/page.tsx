import { LoginForm } from '@/features/auth'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { isLogoutReason, LOGOUT_REASON_PARAM } from '@/features/auth/utils/logoutReason'
import { redirect } from 'next/navigation'

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { user } = await getAuthUser()
  if (user) {
    redirect('/dashboard')
  }

  const reason = (await searchParams)[LOGOUT_REASON_PARAM]
  const logoutReason = isLogoutReason(reason) ? reason : undefined

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm logoutReason={logoutReason} />
      </div>
    </div>
  )
}
