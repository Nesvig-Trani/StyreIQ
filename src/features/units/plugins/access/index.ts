import { Organization } from '@/types/payload-types'
import { Access } from 'payload'
import { UserRolesEnum } from '@/features/users'
import { buildAccessibleUnitFilter } from '../utils'

export const canReadUnit: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === UserRolesEnum.SuperAdmin) return true

  const orgs = user.organizations as Organization[]

  const where = buildAccessibleUnitFilter({ orgs })

  return where
}

export const canDeleteUnit: Access = ({ req: { user } }) => {
  return !!(user && user.role === UserRolesEnum.SuperAdmin)
}
