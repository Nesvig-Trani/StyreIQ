import { Organization } from '@/payload-types'
import { Where } from 'payload'

export const buildAccessibleOrgsFilter = ({ orgs }: { orgs: Organization[] }) => {
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
