'use server'
import {
  createUserForQueriesFromCookie,
  getSelectedTenantIdFromCookie,
} from '@/app/(dashboard)/server-tenant-context'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { UserRolesEnum } from '@/shared/constants/user-roles'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
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

export const getUnitsWithFilter = async ({ status, type }: { status?: string; type?: string }) => {
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

  // First, get the user's organizations
  const userOrgIds = await payload.db.drizzle.query.organization.findMany({
    where: (orgs, { inArray }) =>
      inArray(
        orgs.id,
        user.organizations!.map((org) =>
          typeof org === 'object' && org !== null && 'id' in org ? org.id : org,
        ),
      ),
  })

  // Get all organizations that are either user's orgs or their children
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

  // Create a where clause that includes all user's orgs and their children
  const where: Where = {
    and: [
      {
        id: {
          in: organizations.map((org) => org.id),
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
