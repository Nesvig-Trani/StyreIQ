import { Organization } from '@/types/payload-types'
import { buildAccessibleOrgsFilter } from '@/features/organizations/plugins/utils'
import { UserRolesEnum } from '@/features/users'
import { Access, Where } from 'payload'

export const canReadUsers: Access = async ({ req: { user, payload } }) => {
  if (!user) return false
  if (user.role === UserRolesEnum.SuperAdmin) {
    return true
  }

  const orgs = user.organizations as Organization[]
  const whereOrg = buildAccessibleOrgsFilter({ orgs })

  const organizations = await payload.find({
    collection: 'organization',
    where: whereOrg,
    limit: 0,
  })

  const orgIds = organizations.docs.map((org) => org.id)

  const where: Where = {
    'organizations.id': {
      in: orgIds,
    },
  }

  return where
}
