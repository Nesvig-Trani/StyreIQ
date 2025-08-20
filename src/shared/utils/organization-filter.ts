import { Organization, User } from '@/types/payload-types'
import { buildAccessibleUnitFilter } from '@/features/units/plugins/utils'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { UserRolesEnum } from '@/features/users'

export interface AccessibleOrganizationsResult {
  organizations: Organization[]
  accessibleOrgIds: number[]
}

export async function getAccessibleOrganizations(
  user: User | null,
): Promise<AccessibleOrganizationsResult> {
  if (!user || user.role === UserRolesEnum.SuperAdmin) {
    const { payload } = await getPayloadContext()
    const allOrganizations = await payload.find({
      collection: 'organization',
      limit: 0,
    })

    return {
      organizations: allOrganizations.docs,
      accessibleOrgIds: allOrganizations.docs.map((org) => org.id),
    }
  }

  const orgs = user.organizations as Organization[]
  if (!orgs || orgs.length === 0) {
    return {
      organizations: [],
      accessibleOrgIds: [],
    }
  }

  const { payload } = await getPayloadContext()
  const whereOrg = buildAccessibleUnitFilter({ orgs })
  const accessibleOrganizations = await payload.find({
    collection: 'organization',
    where: whereOrg,
    limit: 0,
  })

  return {
    organizations: accessibleOrganizations.docs,
    accessibleOrgIds: accessibleOrganizations.docs.map((org) => org.id),
  }
}

export async function getAccessibleOrganizationsForUser(
  user: User | null,
): Promise<Organization[]> {
  const result = await getAccessibleOrganizations(user)
  return result.organizations
}

export async function getAccessibleOrgIdsForUser(user: User | null): Promise<number[]> {
  const result = await getAccessibleOrganizations(user)
  return result.accessibleOrgIds
}
