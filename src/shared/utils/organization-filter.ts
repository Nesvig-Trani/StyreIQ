import { Organization, User } from '@/types/payload-types'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { UserRolesEnum } from '@/features/users'
import type { Payload } from 'payload'

export interface AccessibleOrganizationsResult {
  organizations: Organization[]
  accessibleOrgIds: number[]
}

async function findDescendantOrgIds(payload: Payload, parentIds: number[]): Promise<number[]> {
  if (parentIds.length === 0) return []

  const children = await payload.find({
    collection: 'organization',
    where: { parentOrg: { in: parentIds } },
    limit: 0,
  })

  const childIds = children.docs.map((org) => org.id as number)
  if (childIds.length === 0) return []

  const grandchildren = await findDescendantOrgIds(payload, childIds)
  return [...childIds, ...grandchildren]
}

export async function getAccessibleOrganizationsWithPayload(
  user: User | null,
  payload: Payload,
): Promise<AccessibleOrganizationsResult> {
  if (!user || user.role === UserRolesEnum.SuperAdmin) {
    const allOrganizations = await payload.find({
      collection: 'organization',
      limit: 0,
    })

    return {
      organizations: allOrganizations.docs,
      accessibleOrgIds: allOrganizations.docs.map((org) => org.id as number),
    }
  }

  if (user.role === UserRolesEnum.CentralAdmin) {
    if (!user.tenant) {
      return { organizations: [], accessibleOrgIds: [] }
    }

    const allTenantOrgs = await payload.find({
      collection: 'organization',
      where: { tenant: { equals: user.tenant } },
      limit: 0,
    })

    return {
      organizations: allTenantOrgs.docs,
      accessibleOrgIds: allTenantOrgs.docs.map((org) => org.id as number),
    }
  }

  if (user.role === UserRolesEnum.UnitAdmin) {
    const userOrgs = user.organizations as Organization[]
    if (!userOrgs || userOrgs.length === 0) {
      return { organizations: [], accessibleOrgIds: [] }
    }

    const directOrgIds = userOrgs.map((org) =>
      typeof org === 'object' && org !== null ? (org.id as number) : (org as number),
    )

    const descendantIds = await findDescendantOrgIds(payload, directOrgIds)

    const allAccessibleIds = [...directOrgIds, ...descendantIds]

    const organizations = await payload.find({
      collection: 'organization',
      where: { id: { in: allAccessibleIds } },
      limit: 0,
    })

    return {
      organizations: organizations.docs,
      accessibleOrgIds: allAccessibleIds,
    }
  }

  if (user.role === UserRolesEnum.SocialMediaManager) {
    const userOrgs = user.organizations as Organization[]
    if (!userOrgs || userOrgs.length === 0) {
      return { organizations: [], accessibleOrgIds: [] }
    }

    const orgIds = userOrgs.map((org) =>
      typeof org === 'object' && org !== null ? (org.id as number) : (org as number),
    )

    const organizations = await payload.find({
      collection: 'organization',
      where: { id: { in: orgIds } },
      limit: 0,
    })

    return {
      organizations: organizations.docs,
      accessibleOrgIds: orgIds,
    }
  }

  return { organizations: [], accessibleOrgIds: [] }
}

export async function getAccessibleOrgIdsForUserWithPayload(
  user: User | null,
  payload: Payload,
): Promise<number[]> {
  const result = await getAccessibleOrganizationsWithPayload(user, payload)
  return result.accessibleOrgIds
}

export async function getAccessibleOrganizationsForUserWithPayload(
  user: User | null,
  payload: Payload,
): Promise<Organization[]> {
  const result = await getAccessibleOrganizationsWithPayload(user, payload)
  return result.organizations
}

export async function getAccessibleOrganizations(
  user: User | null,
): Promise<AccessibleOrganizationsResult> {
  const { payload } = await getPayloadContext()
  return getAccessibleOrganizationsWithPayload(user, payload)
}

export async function getAccessibleOrgIdsForUser(user: User | null): Promise<number[]> {
  const result = await getAccessibleOrganizations(user)
  return result.accessibleOrgIds
}

export async function getAccessibleOrganizationsForUser(
  user: User | null,
): Promise<Organization[]> {
  const result = await getAccessibleOrganizations(user)
  return result.organizations
}
