import { getTotalUsers } from '@/features/users'
import LandingPage from './landing-page'

export default async function Page() {
  const totalUsers = await getTotalUsers()
  const showGetStarted = totalUsers === 0

  return <LandingPage showGetStarted={showGetStarted} />
}
