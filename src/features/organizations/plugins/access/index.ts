import { Organization } from '@/types/payload-types'
import { Access } from 'payload'
import { UserRolesEnum } from '@/features/users'
import { buildAccessibleOrgsFilter } from '../utils'

export const canReadOrganizations: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === UserRolesEnum.SuperAdmin) return true

  const orgs = user.organizations as Organization[]

  const where = buildAccessibleOrgsFilter({ orgs })

  return where
}

export const canDeleteOrganizations: Access = ({ req: { user } }) => {
  return !!(user && user.role === UserRolesEnum.SuperAdmin)
}
