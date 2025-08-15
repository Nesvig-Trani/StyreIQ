import { Organization } from '@/types/payload-types'
import { buildAccessibleUnitFilter } from '@/features/units/plugins/utils'
import { Access } from 'payload'
import { UserRolesEnum } from '@/features/users'

export const canReadFlags: Access = async ({ req: { user, payload } }) => {
  if (!user) return false
  if (user.role === UserRolesEnum.SuperAdmin) return true
  const orgs = user.organizations as Organization[]
  const whereOrg = buildAccessibleUnitFilter({ orgs })

  const organizations = await payload.find({
    collection: 'organization',
    where: whereOrg,
    limit: 0,
  })

  const orgIds = organizations.docs.map((org) => org.id)
  return {
    organizations: {
      in: orgIds,
    },
  }
}
