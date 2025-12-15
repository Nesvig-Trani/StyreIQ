'use server'
import { PaginatedDocs, Where } from 'payload'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import type { User } from '@/types/payload-types'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { UserRolesEnum, UserStatusEnum } from '@/features/users'
import { getAccessibleOrgIdsForUser } from '@/shared'

import {
  createUserForQueriesFromCookie,
  getSelectedTenantIdFromCookie,
} from '@/app/(dashboard)/server-tenant-context'
import { extractTenantId } from '@/features/tenants/plugins/collections/helpers/access-control-helpers'

export const getUsersByOrganizations = async ({ orgIds }: { orgIds: number[] }) => {
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

  const where: Where = orgIds.length === 0 ? {} : { 'organizations.id': { in: orgIds } }

  return await payload.find({
    collection: 'users',
    where,
    overrideAccess: false,
    user: userForQueries,
  })
}

export const getUserById = async ({ id }: { id: number }) => {
  const { payload } = await getPayloadContext()
  const user = await payload.findByID({
    collection: 'users',
    id: id,
    depth: 0,
  })
  return user
}

export const getUsersByIds = async ({ ids }: { ids: number[] }) => {
  if (ids.length === 0) return []

  const { payload } = await getPayloadContext()
  const users = await payload.find({
    collection: 'users',
    where: {
      id: {
        in: ids,
      },
    },
    depth: 0,
    limit: ids.length,
  })
  return users.docs
}

export const getPendingActivationUsers = async ({
  limit,
  page,
  user,
}: {
  limit: number
  page: number
  user: User | null
}) => {
  const { payload } = await getPayloadContext()

  if (!user) {
    return {
      docs: [],
      totalDocs: 0,
      hasNextPage: false,
      hasPrevPage: false,
      totalPages: 0,
      limit: 0,
      page: 1,
      pagingCounter: 0,
      prevPage: null,
      nextPage: null,
    }
  }

  const userForQueries = await createUserForQueriesFromCookie(user)

  return await payload.find({
    collection: 'users',
    where: { status: { equals: UserStatusEnum.PendingActivation } },
    depth: 1,
    limit,
    page,
    overrideAccess: false,
    user: userForQueries,
  })
}

export const getAllUsers = async () => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
    return {
      docs: [],
      totalDocs: 0,
      hasNextPage: false,
      hasPrevPage: false,
      totalPages: 0,
      limit: 0,
      page: 1,
      pagingCounter: 0,
      prevPage: null,
      nextPage: null,
    }
  }

  const userForQueries = await createUserForQueriesFromCookie(user)
  const selectedTenantId = await getSelectedTenantIdFromCookie()

  const where: Where = {}
  if (user.role === UserRolesEnum.SuperAdmin && selectedTenantId !== null) {
    where.tenant = { equals: selectedTenantId }
  }

  const users = await payload.find({
    collection: 'users',
    where,
    limit: 0,
    depth: 0,
    overrideAccess: user.role === UserRolesEnum.SuperAdmin,
    user: userForQueries,
  })

  return users
}

/**
 * Returns the total of users.
 * @returns
 */
export const getTotalUsers = async (): Promise<number> => {
  try {
    const { payload } = await getPayloadContext()

    const allUsers = await payload.find({
      collection: 'users',
    })
    return allUsers.totalDocs
  } catch {
    return 0
  }
}

export const getUsersByRoles = async (roles: UserRolesEnum[]) => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
    return {
      docs: [],
      totalDocs: 0,
      hasNextPage: false,
      hasPrevPage: false,
      totalPages: 0,
      limit: 0,
      page: 1,
      pagingCounter: 0,
      prevPage: null,
      nextPage: null,
    }
  }
  const userForQueries = await createUserForQueriesFromCookie(user)
  const selectedTenantId = await getSelectedTenantIdFromCookie()

  const where: Where = {
    role: { in: roles },
    status: { equals: UserStatusEnum.Active },
  }

  if (user.role === UserRolesEnum.SuperAdmin) {
    if (selectedTenantId !== null) {
      where.tenant = { equals: selectedTenantId }
    }
  } else {
    const userTenantId = extractTenantId(user)
    if (userTenantId) {
      where.tenant = { equals: userTenantId }
    }
  }

  return await payload.find({
    collection: 'users',
    where,
    overrideAccess: user.role === UserRolesEnum.SuperAdmin,
    user: userForQueries,
  })
}

export const getUsersByOrganizationAndRole = async ({
  organizationId,
  roles,
}: {
  organizationId: number
  roles: UserRolesEnum[]
}): Promise<PaginatedDocs<User>> => {
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

  return await payload.find({
    collection: 'users',
    where: {
      'organizations.id': { equals: organizationId },
      role: { in: roles },
      status: { equals: UserStatusEnum.Active },
    },
    overrideAccess: false,
    user: userForQueries,
  })
}

interface DashboardData {
  totalAccounts: number
  accountsByStatus: {
    active: number
    inactive: number
    inTransition: number
  }
  activeUsers: {
    superAdmin: number
    unitAdmins: number
    socialMediaManagers: number
  }
  pendingApproval: number
  unassignedAccounts: number
}

export const getUsersInfoForDashboard = async (): Promise<DashboardData> => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  const defaultData: DashboardData = {
    totalAccounts: 0,
    accountsByStatus: {
      active: 0,
      inactive: 0,
      inTransition: 0,
    },
    activeUsers: {
      superAdmin: 0,
      unitAdmins: 0,
      socialMediaManagers: 0,
    },
    pendingApproval: 0,
    unassignedAccounts: 0,
  }

  if (!user) return defaultData

  const userForQueries = await createUserForQueriesFromCookie(user)
  const selectedTenantId = await getSelectedTenantIdFromCookie()

  let where: Where = {}
  let users: PaginatedDocs<User>

  switch (user.role) {
    case UserRolesEnum.SocialMediaManager: {
      users = await payload.find({
        collection: 'users',
        where: {
          id: { equals: user.id },
        },
        limit: 0,
        overrideAccess: false,
        user: userForQueries,
      })
      break
    }
    case UserRolesEnum.SuperAdmin: {
      if (selectedTenantId !== null) {
        where = {
          tenant: { equals: selectedTenantId },
        }
      }

      users = await payload.find({
        collection: 'users',
        where,
        limit: 0,
        overrideAccess: true,
        user: userForQueries,
      })
      break
    }
    default: {
      const accessibleOrgIds = await getAccessibleOrgIdsForUser(user, selectedTenantId)

      if (accessibleOrgIds.length === 0) {
        return defaultData
      }

      where = {
        'organizations.id': {
          in: accessibleOrgIds,
        },
      }

      users = await payload.find({
        collection: 'users',
        where,
        limit: 0,
        overrideAccess: false,
        user: userForQueries,
      })
      break
    }
  }

  const dashboardData: DashboardData = {
    totalAccounts: users.totalDocs,
    accountsByStatus: {
      active: users.docs.filter((u) => u.status === UserStatusEnum.Active).length,
      inactive: users.docs.filter((u) => u.status === UserStatusEnum.Inactive).length,
      inTransition: users.docs.filter((u) => u.status === UserStatusEnum.PendingActivation).length,
    },
    activeUsers: {
      superAdmin: users.docs.filter(
        (u) => u.role === UserRolesEnum.SuperAdmin && u.status === UserStatusEnum.Active,
      ).length,
      unitAdmins: users.docs.filter(
        (u) => u.role === UserRolesEnum.UnitAdmin && u.status === UserStatusEnum.Active,
      ).length,
      socialMediaManagers: users.docs.filter(
        (u) => u.role === UserRolesEnum.SocialMediaManager && u.status === UserStatusEnum.Active,
      ).length,
    },
    pendingApproval: users.docs.filter((u) => u.status === UserStatusEnum.PendingActivation).length,
    unassignedAccounts: users.docs.filter((u) => !u.organizations || u.organizations.length === 0)
      .length,
  }

  return dashboardData
}

export const getUsers = async ({
  pageSize,
  pageIndex,
}: {
  pageSize: number
  pageIndex: number
}) => {
  const { user } = await getAuthUser()
  const { payload } = await getPayloadContext()

  if (!user) {
    return {
      docs: [],
      totalDocs: 0,
      totalPages: 0,
      page: pageIndex,
      limit: pageSize,
      hasNextPage: false,
      hasPrevPage: false,
      pagingCounter: 0,
    }
  }

  const userForQueries = await createUserForQueriesFromCookie(user)
  const selectedTenantId = await getSelectedTenantIdFromCookie()

  let result

  switch (user.role) {
    case UserRolesEnum.SocialMediaManager: {
      const me = await payload.find({
        collection: 'users',
        where: {
          id: { equals: user.id },
        },
        page: 1,
        limit: 1,
        overrideAccess: false,
        user: userForQueries,
      })

      result = me
      break
    }
    case UserRolesEnum.SuperAdmin: {
      const where: Where = {}

      if (selectedTenantId !== null) {
        where.tenant = { equals: selectedTenantId }
      }

      const users = await payload.find({
        collection: 'users',
        page: pageIndex,
        limit: pageSize,
        where,
        overrideAccess: true,
        user: userForQueries,
      })

      result = users
      break
    }
    default: {
      const accessibleOrgIds = await getAccessibleOrgIdsForUser(user, selectedTenantId)

      if (accessibleOrgIds.length === 0) {
        result = {
          docs: [],
          totalDocs: 0,
          totalPages: 0,
          page: pageIndex,
          limit: pageSize,
          hasNextPage: false,
          hasPrevPage: false,
          pagingCounter: 0,
        }
        break
      }

      const where: Where = {
        'organizations.id': {
          in: accessibleOrgIds,
        },
      }

      const users = await payload.find({
        collection: 'users',
        page: pageIndex,
        limit: pageSize,
        where,
        overrideAccess: false,
        user: userForQueries,
      })

      result = users
      break
    }
  }

  return result
}
