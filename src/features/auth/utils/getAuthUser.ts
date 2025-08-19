'use server'
import { headers as getHeaders } from 'next/headers'
import { UserAccessTypeEnum } from '@/features/units'
import { OrganizationAccess } from '@/types/payload-types'
import { getUnitAccessByUserId } from '@/features/units'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { UserRolesEnum, UserStatusEnum } from '@/features/users'

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

export async function verifyUser() {
  const { user } = await getAuthUser()
  const now = new Date()
  if (!user) {
    return null
  }

  const accessibleOrganizations: OrganizationAccess[] = []
  const orgAccessResult = await getUnitAccessByUserId({ id: user.id })
  orgAccessResult.docs.forEach((access) => {
    const endDate = access.end_date ? new Date(access.end_date) : null
    if (access.type === UserAccessTypeEnum.Permanent || (endDate && endDate > now)) {
      accessibleOrganizations.push(access)
    }
  })

  if (accessibleOrganizations.length === 0 || user.status !== UserStatusEnum.Active) {
    if (user.role === UserRolesEnum.SuperAdmin) {
      return user
    }
    return null
  }
  return user
}
