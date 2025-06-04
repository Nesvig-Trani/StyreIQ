'use server'
import { headers as getHeaders } from 'next/headers'
import { UserAccessTypeEnum } from '@/organization-access'
import { OrganizationAccess } from '@/payload-types'
import { getOrganizationAccessByUserId } from '@/organization-access/queries'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { UserStatusEnum } from '@/users'

export async function getAuthUser() {
  const headers = await getHeaders()
  const { payload } = await getPayloadContext()
  const { user } = await payload.auth({ headers })

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
  const orgAccessResult = await getOrganizationAccessByUserId({ id: user.id })
  orgAccessResult.docs.forEach((access) => {
    const endDate = access.end_date ? new Date(access.end_date) : null
    if (access.type === UserAccessTypeEnum.Permanent || (endDate && endDate > now)) {
      accessibleOrganizations.push(access)
    }
  })

  if (accessibleOrganizations.length === 0 || user.status !== UserStatusEnum.Active) {
    return null
  }
  return user
}
