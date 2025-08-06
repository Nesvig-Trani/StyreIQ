import { redirect } from 'next/navigation'
import { getTotalUsers } from '@/features/users'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import LandingPage from './(landing)/landing-page'

export default async function Page() {
  const totalUsers = await getTotalUsers()
  const { user } = await getAuthUser()

  // If there are users and user is authenticated, redirect to dashboard
  if (totalUsers > 0 && user) {
    redirect('/dashboard')
  }

  // Show landing page for unauthenticated users or new installations
  const showGetStarted = totalUsers === 0
  return <LandingPage showGetStarted={showGetStarted} />
}
