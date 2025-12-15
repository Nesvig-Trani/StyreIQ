import { Organization } from '@/types/payload-types'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { UserRolesEnum } from '@/features/users'
import type { Payload, User, Where } from 'payload'
import { extractTenantId } from '@/features/tenants/plugins/collections/helpers/access-control-helpers'

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
  selectedTenantId?: number | null,
): Promise<AccessibleOrganizationsResult> {
  if (!user) {
    return { organizations: [], accessibleOrgIds: [] }
  }

  switch (user.role) {
    case UserRolesEnum.SuperAdmin: {
      const where: Where = {}

      if (selectedTenantId !== null && selectedTenantId !== undefined) {
        where.tenant = { equals: selectedTenantId }
      }

      const allOrganizations = await payload.find({
        collection: 'organization',
        where,
        limit: 0,
      })

      return {
        organizations: allOrganizations.docs,
        accessibleOrgIds: allOrganizations.docs.map((org) => org.id as number),
      }
    }
    case UserRolesEnum.CentralAdmin: {
      const tenantId = extractTenantId(user)

      if (!tenantId) {
        return { organizations: [], accessibleOrgIds: [] }
      }

      const allTenantOrgs = await payload.find({
        collection: 'organization',
        where: { tenant: { equals: tenantId } },
        limit: 0,
      })

      return {
        organizations: allTenantOrgs.docs,
        accessibleOrgIds: allTenantOrgs.docs.map((org) => org.id as number),
      }
    }
    case UserRolesEnum.UnitAdmin: {
      const userOrgs = user.organizations as Organization[]

      if (!userOrgs || userOrgs.length === 0) {
        return { organizations: [], accessibleOrgIds: [] }
      }

      const tenantId = extractTenantId(user)
      if (!tenantId) {
        return { organizations: [], accessibleOrgIds: [] }
      }

      const directOrgIds = userOrgs.map((org) =>
        typeof org === 'object' && org !== null ? (org.id as number) : (org as number),
      )

      const descendantIds = await findDescendantOrgIds(payload, directOrgIds)
      const allAccessibleIds = [...directOrgIds, ...descendantIds]

      const organizations = await payload.find({
        collection: 'organization',
        where: {
          and: [{ id: { in: allAccessibleIds } }, { tenant: { equals: tenantId } }],
        },
        limit: 0,
      })

      return {
        organizations: organizations.docs,
        accessibleOrgIds: allAccessibleIds,
      }
    }
    case UserRolesEnum.SocialMediaManager: {
      const userOrgs = user.organizations as Organization[]

      if (!userOrgs || userOrgs.length === 0) {
        return { organizations: [], accessibleOrgIds: [] }
      }

      const tenantId = extractTenantId(user)
      if (!tenantId) {
        return { organizations: [], accessibleOrgIds: [] }
      }

      const orgIds = userOrgs.map((org) =>
        typeof org === 'object' && org !== null ? (org.id as number) : (org as number),
      )

      const organizations = await payload.find({
        collection: 'organization',
        where: {
          and: [{ id: { in: orgIds } }, { tenant: { equals: tenantId } }],
        },
        limit: 0,
      })

      return {
        organizations: organizations.docs,
        accessibleOrgIds: orgIds,
      }
    }
    default:
      return { organizations: [], accessibleOrgIds: [] }
  }
}

export async function getAccessibleOrgIdsForUserWithPayload(
  user: User | null,
  payload: Payload,
  selectedTenantId?: number | null,
): Promise<number[]> {
  const result = await getAccessibleOrganizationsWithPayload(user, payload, selectedTenantId)
  return result.accessibleOrgIds
}

export async function getAccessibleOrganizationsForUserWithPayload(
  user: User | null,
  payload: Payload,
  selectedTenantId?: number | null,
): Promise<Organization[]> {
  const result = await getAccessibleOrganizationsWithPayload(user, payload, selectedTenantId)
  return result.organizations
}

export async function getAccessibleOrganizations(
  user: User | null,
  selectedTenantId?: number | null,
): Promise<AccessibleOrganizationsResult> {
  const { payload } = await getPayloadContext()
  return getAccessibleOrganizationsWithPayload(user, payload, selectedTenantId)
}

export async function getAccessibleOrgIdsForUser(
  user: User | null,
  selectedTenantId?: number | null,
): Promise<number[]> {
  const result = await getAccessibleOrganizations(user, selectedTenantId)
  return result.accessibleOrgIds
}

export async function getAccessibleOrganizationsForUser(
  user: User | null,
  selectedTenantId?: number | null,
): Promise<Organization[]> {
  const result = await getAccessibleOrganizations(user, selectedTenantId)
  return result.organizations
}
