'use server'

import { getAuthUser, verifyUser } from '@/features/auth/utils/getAuthUser'
import { LOGOUT_REASON_PARAM, LOGOUT_REASONS } from '@/features/auth/utils/logoutReason'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getTotalUsers, UserStatusEnum } from '@/features/users'

export async function serverAuthGuard() {
  const user = await verifyUser()
  if (user) {
    return
  }

  const { user: authUser } = await getAuthUser()
  if (authUser && authUser.status !== UserStatusEnum.Active) {
    redirect(`/api/logout?${LOGOUT_REASON_PARAM}=${LOGOUT_REASONS.inactive}`)
  }

  // An active user that fails verifyUser has no current (permanent or unexpired) unit access.
  if (authUser) {
    redirect(`/api/logout?${LOGOUT_REASON_PARAM}=${LOGOUT_REASONS.noUnitAccess}`)
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
