'use server'

import { verifyUser } from '@/auth/utils/getAuthUser'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getTotalUsers } from '@/users'

export async function serverAuthGuard() {
  const user = await verifyUser()
  if (user) {
    return
  }
  const headers = await getHeaders()
  const cookie = headers.get('cookie')
  if (cookie) {
    redirect('/api/logout')
  }

  const totalUsers = await getTotalUsers()

  if (totalUsers === 0) {
    redirect('/login/create-first-user')
  }

  redirect('/login')
}
