'use server'
import { PaginatedDocs, Where } from 'payload'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { User } from '@/types/payload-types'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { UserRolesEnum, UserStatusEnum } from '@/features/users'
import { getAccessibleOrgIdsForUser } from '@/shared'

export const getUsersByOrganizations = async ({
  orgIds,
}: {
  orgIds: number[]
}): Promise<PaginatedDocs<User>> => {
  try {
    const { payload } = await getPayloadContext()
    const { user } = await getAuthUser()

    const where: Where =
      orgIds.length === 0
        ? {}
        : {
            'organizations.id': { in: orgIds },
          }

    const users = await payload.find({
      collection: 'users',
      where,
      overrideAccess: false,
      user,
    })
    return users
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
  const users = await payload.find({
    collection: 'users',
    where: {
      status: { equals: UserStatusEnum.PendingActivation },
    },
    depth: 1,
    limit,
    page,
    overrideAccess: false,
    user: user,
  })
  return users
}

export const getAllUsers = async () => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  const users = await payload.find({
    collection: 'users',
    limit: 0,
    depth: 0,
    overrideAccess: false,
    user,
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
  const users = await payload.find({
    collection: 'users',
    where: {
      role: {
        in: roles,
      },
      status: { equals: UserStatusEnum.Active },
    },
    overrideAccess: false,
    user,
  })
  return users
}

export const getUsersByOrganizationAndRole = async ({
  organizationId,
  roles,
}: {
  organizationId: number
  roles: UserRolesEnum[]
}): Promise<PaginatedDocs<User>> => {
  try {
    const { payload } = await getPayloadContext()
    const { user } = await getAuthUser()

    const users = await payload.find({
      collection: 'users',
      where: {
        'organizations.id': { equals: organizationId },
        role: {
          in: roles,
        },
        status: { equals: UserStatusEnum.Active },
      },
      overrideAccess: false,
      user,
    })
    return users
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

interface DashboardData {
  totalAccounts: number
  accountsByStatus: {
    active: number
    inactive: number
    inTransition: number
  }
  activeUsers: {
    unitAdmins: number
    socialMediaManagers: number
  }
  pendingApproval: number
  unassignedAccounts: number
}

export const getUsersInfoForDashboard = async () => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
    return {
      totalAccounts: 0,
      accountsByStatus: {
        active: 0,
        inactive: 0,
        inTransition: 0,
      },
      activeUsers: {
        unitAdmins: 0,
        socialMediaManagers: 0,
      },
      pendingApproval: 0,
      unassignedAccounts: 0,
    }
  }

  let where: Where = {}

  if (user.role !== UserRolesEnum.SuperAdmin) {
    const accessibleOrgIds = await getAccessibleOrgIdsForUser(user)

    if (accessibleOrgIds.length > 0) {
      where = {
        'organizations.id': {
          in: accessibleOrgIds,
        },
      }
    }
  }

  const users = await payload.find({
    collection: 'users',
    where,
    depth: 0,
    overrideAccess: false,
    user,
  })

  const dashboardData: DashboardData = {
    totalAccounts: users.totalDocs,
    accountsByStatus: {
      active: users.docs.filter((u) => u.status === UserStatusEnum.Active).length,
      inactive: users.docs.filter((u) => u.status === UserStatusEnum.Inactive).length,
      inTransition: users.docs.filter((u) => u.status === UserStatusEnum.PendingActivation).length,
    },
    activeUsers: {
      unitAdmins: users.docs.filter((u) => u.role === UserRolesEnum.UnitAdmin).length,
      socialMediaManagers: users.docs.filter((u) => u.role === UserRolesEnum.SocialMediaManager)
        .length,
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

  if (user.role === UserRolesEnum.SocialMediaManager) {
    const me = await payload.find({
      collection: 'users',
      where: {
        id: { equals: user.id },
      },
      page: 1,
      limit: 1,
      overrideAccess: false,
      user,
    })

    return me
  }

  if (user.role === UserRolesEnum.SuperAdmin) {
    const users = await payload.find({
      collection: 'users',
      page: pageIndex,
      limit: pageSize,
      overrideAccess: false,
      user,
    })
    return users
  }

  const accessibleOrgIds = await getAccessibleOrgIdsForUser(user)

  if (accessibleOrgIds.length === 0) {
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
    user,
  })

  return users
}
