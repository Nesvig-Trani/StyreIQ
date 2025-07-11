import { Organization } from '@/payload-types'
import { Access, Where } from 'payload'
import { UserRolesEnum } from '@/users'

export const canReadOrganizations: Access = ({ req: { user } }) => {
  if (!user) return false

  const orgs = user.organizations as Organization[]
  const organizationIds = orgs.map((org) => org.id)

  const orgWhere: Where[] = organizationIds.reduce<Where[]>((acc, orgId) => {
    acc.push({ id: { equals: orgId } })
    acc.push({ path: { contains: orgId } })
    return acc
  }, [])

  const where: Where = {
    and: [
      {
        or: orgWhere,
      },
      {
        disabled: { not_equals: true },
      },
    ],
  }

  return where
}

export const canDeleteOrganizations: Access = ({ req: { user } }) => {
  return !!(user && user.role === UserRolesEnum.SuperAdmin)
}
