'use server'

import { getAuthUser } from '@/auth/utils/getAuthUser'
import { redirect } from 'next/navigation'
import { getTotalUsers } from '@/plugins/users/queries'

export async function serverAuthNoUsersGuard() {
  const { user } = await getAuthUser()

  if (user) {
    redirect('/dashboard')
  }

  const totalUsers = await getTotalUsers()

  if (totalUsers > 0) {
    redirect('/login')
  }
}
