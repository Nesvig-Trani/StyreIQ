import { Organization } from '@/payload-types'
import { Access } from 'payload'
import { UserRolesEnum } from '@/users'

export const canReadOrganizations: Access = ({ req: { user } }) => {
  if (!user) return false
  const orgs = user.organizations as Organization[]
  const organizationIds = orgs.map((org) => org.id)

  const orgWhere: { id?: { equals: number }; path?: { contains: number } }[] =
    organizationIds.flatMap((orgId) => [{ id: { equals: orgId } }, { path: { contains: orgId } }])

  return {
    or: orgWhere,
  }
}

export const canDeleteOrganizations: Access = ({ req: { user } }) => {
  return !!(user && user.role === UserRolesEnum.SuperAdmin)
}
