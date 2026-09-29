'use server'
import { headers as getHeaders } from 'next/headers'
import { UserAccessTypeEnum } from '@/features/units'
import { OrganizationAccess } from '@/types/payload-types'
import { getUnitAccessByUserId } from '@/features/units'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { UserRolesEnum, UserStatusEnum } from '@/features/users'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

export async function getAuthUser() {
  const headers = await getHeaders()
  const { payload } = await getPayloadContext()
  const { user } = await payload.auth({ headers })

  if (!user) {
    return {
      headers,
      user: null,
    }
  }

  return {
    headers,
    user,
  }
}

type AuthUser = Awaited<ReturnType<typeof getAuthUser>>['user']

// Callers that already loaded the user pass it in to skip a second payload.auth().
export async function verifyUser(authUser?: AuthUser) {
  const user = authUser === undefined ? (await getAuthUser()).user : authUser
  const now = new Date()
  if (!user) {
    return null
  }

  const effectiveRole = getEffectiveRoleFromUser(user)
  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin
  const accessibleOrganizations: OrganizationAccess[] = []
  const orgAccessResult = await getUnitAccessByUserId({ id: user.id })
  orgAccessResult.docs.forEach((access) => {
    const endDate = access.end_date ? new Date(access.end_date) : null
    if (access.type === UserAccessTypeEnum.Permanent || (endDate && endDate > now)) {
      accessibleOrganizations.push(access)
    }
  })

  if (accessibleOrganizations.length === 0 || user.status !== UserStatusEnum.Active) {
    if (isSuperAdmin) {
      return user
    }
    return null
  }
  return user
}
