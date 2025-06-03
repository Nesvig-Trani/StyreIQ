import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { UserAccessTypeEnum } from '@/organization-access'
import { logout } from '@/sdk/users'
import { OrganizationAccess } from '@/payload-types'

export async function getAuthUser() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })
  const now = new Date()
  if (!user) {
    redirect('/login')
  }
  const accessibleOrganizations: OrganizationAccess[] = []
  const orgAccessResult = await payload.find({
    collection: 'organization_access',
    where: {
      'user.id': { equals: user.id },
    },
  })
  
  orgAccessResult.docs.forEach((access) => {
    if (access.type === UserAccessTypeEnum.Permanent || new Date(access.end_date || '') > now) {
      accessibleOrganizations.push(access)
    }
  })
  if (accessibleOrganizations.length === 0) {
    logout({ cookie: headers.get('cookie') || '' })
  }

  return {
    headers,
    user,
  }
}
