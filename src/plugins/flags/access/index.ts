import { Organization } from '@/payload-types'
import { buildAccessibleOrgsFilter } from '@/plugins/organizations/utils'
import { Access } from 'payload'
import { UserRolesEnum } from '@/users'

export const canReadFlags: Access = async ({ req: { user, payload } }) => {
  if (!user) return false
  if (user.role === UserRolesEnum.SuperAdmin) return true
  const orgs = user.organizations as Organization[]
  const whereOrg = buildAccessibleOrgsFilter({ orgs })

  const organizations = await payload.find({
    collection: 'organization',
    where: whereOrg,
    limit: 0,
  })

  const orgIds = organizations.docs.map((org) => org.id)
  return {
    organization: {
      in: orgIds,
    },
  }
}
