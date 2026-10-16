'use server'
import {
  createUserForQueriesFromCookie,
  getSelectedTenantIdFromCookie,
} from '@/app/(dashboard)/server-tenant-context'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { UserRolesEnum } from '@/shared/constants/user-roles'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { getAccessibleOrgIdsForUserWithPayload } from '@/shared/utils/organization-filter'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
import type { User } from '@/types/payload-types'
import type { Payload } from 'payload'
import { Where } from 'payload'

export const getAllUnits = async () => {
  try {
    const { payload } = await getPayloadContext()
    const { user } = await getAuthUser()

    if (!user) {
      return {
        docs: [],
        hasNextPage: false,
        hasPrevPage: false,
        totalDocs: 0,
        totalPages: 0,
        limit: 0,
        pagingCounter: 0,
      }
    }

    const effectiveRole = getEffectiveRoleFromUser(user)
    const userForQueries = await createUserForQueriesFromCookie(user)
    const selectedTenantId = await getSelectedTenantIdFromCookie()

    const where: Where = {
      or: [{ disabled: { equals: false } }, { disabled: { equals: null } }],
    }

    if (effectiveRole === UserRolesEnum.SuperAdmin && selectedTenantId !== null) {
      where.tenant = { equals: selectedTenantId }
    }

    const organizations = await payload.find({
      collection: 'organization',
      depth: 1,
      select: {
        id: true,
        name: true,
        parentOrg: true,
        depth: true,
        path: true,
        tenant: true,
      },
      where,
      limit: 0,
      overrideAccess: effectiveRole === UserRolesEnum.SuperAdmin,
      user: userForQueries,
    })
    return organizations
  } catch {
    return {
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
      totalDocs: 0,
      totalPages: 0,
      limit: 0,
      pagingCounter: 0,
    }
  }
}

const getUserOrgsAndDirectChildrenIds = async (
  payload: Payload,
  userOrganizations: User['organizations'],
) => {
  const userOrgIds = await payload.db.drizzle.query.organization.findMany({
    where: (orgs, { inArray }) =>
      inArray(
        orgs.id,
        userOrganizations!.map((org) =>
          typeof org === 'object' && org !== null && 'id' in org ? org.id : org,
        ),
      ),
  })

  const organizations = await payload.db.drizzle.query.organization.findMany({
    where: (orgs, { or, inArray }) =>
      or(
        inArray(
          // Get organizations that are directly assigned to the user
          orgs.id,
          userOrgIds.map((org) => org.id),
        ),
        inArray(
          // Get organizations that are children of the user's orgs
          orgs.parentOrg,
          userOrgIds.map((org) => org.id),
        ),
      ),
  })

  return organizations.map((org) => org.id)
}

export const getUnitsWithFilter = async ({
  status,
  type,
  tenant,
}: {
  status?: string
  type?: string
  tenant?: string[]
}) => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
    return {
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
      totalDocs: 0,
      totalPages: 0,
      limit: 0,
      pagingCounter: 0,
    }
  }

  const userForQueries = await createUserForQueriesFromCookie(user)
  const selectedTenantId = await getSelectedTenantIdFromCookie()

  const disabledFilter = {
    or: [{ disabled: { equals: false } }, { disabled: { equals: null } }],
  }
  const effectiveRole = getEffectiveRoleFromUser(user)
  if (effectiveRole === 'super_admin') {
    // If the user is a super admin, return all organizations with the specified filte
    const where: Where = {
      ...disabledFilter,
      ...(status ? { status: { equals: status } } : {}),
      ...(type ? { type: { equals: type } } : {}),
    }

    if (selectedTenantId !== null) {
      where.tenant = { equals: selectedTenantId }
    }

    if (tenant && tenant.length > 0) {
      where.tenant = { in: tenant.map(Number) }
    }

    return payload.find({
      collection: 'organization',
      depth: 1,
      overrideAccess: true,
      user: userForQueries,
      limit: 0,
      sort: ['createdAt'],
      where,
    })
  }

  const visibleOrgIds =
    effectiveRole === UserRolesEnum.CentralAdmin
      ? // Same rule as the organization collection's read access: a central admin owns the whole
        // tenant. The one-level lookup used for the other roles hid units nested deeper, so they
        // could be neither selected nor disabled from the tree (GIQ-106).
        await getAccessibleOrgIdsForUserWithPayload(user, payload)
      : await getUserOrgsAndDirectChildrenIds(payload, user.organizations)

  // Create a where clause that includes all user's orgs and their children
  const where: Where = {
    and: [
      {
        id: {
          in: visibleOrgIds,
        },
      },
      {
        ...disabledFilter,
      },
      ...(status ? [{ status: { equals: status } }] : []),
      ...(type ? [{ type: { equals: type } }] : []),
    ],
  }

  return payload.find({
    collection: 'organization',
    depth: 1,
    overrideAccess: false,
    user: userForQueries,
    limit: 0,
    sort: ['createdAt'],
    where,
  })
}
