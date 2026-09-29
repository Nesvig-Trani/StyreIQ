'use server'

import { getAuthUser, verifyUser } from '@/features/auth/utils/getAuthUser'
import { LOGOUT_REASON_PARAM, LOGOUT_REASONS } from '@/features/auth/utils/logoutReason'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getTotalUsers, UserStatusEnum } from '@/features/users'

export async function serverAuthGuard() {
  const { user: authUser } = await getAuthUser()
  if (await verifyUser(authUser)) {
    return
  }

  if (authUser) {
    // verifyUser rejects a non-super-admin for an inactive status or no current unit access.
    const reason =
      authUser.status !== UserStatusEnum.Active
        ? LOGOUT_REASONS.inactive
        : LOGOUT_REASONS.noUnitAccess
    redirect(`/api/logout?${LOGOUT_REASON_PARAM}=${reason}`)
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
