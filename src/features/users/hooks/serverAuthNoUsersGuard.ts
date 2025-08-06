'use server'

import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { redirect } from 'next/navigation'
import { getTotalUsers } from '../plugins/queries'

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
