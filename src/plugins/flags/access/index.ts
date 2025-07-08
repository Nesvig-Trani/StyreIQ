import { Organization } from '@/payload-types'
import { Access } from 'payload'

export const canReadFlags: Access = ({ req: { user } }) => {
  if (!user) return false
  const orgs = user.organizations as Organization[]
  const organizationIds = orgs.map((org) => org.id)

  return {
    organization: {
      in: organizationIds,
    },
  }
}
