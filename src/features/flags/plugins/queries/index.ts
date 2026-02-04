import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { FlagsCollectionSlug } from '../types'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { FlagStatusEnum, FlagTypeEnum } from '@/features/flags/schemas'
import { endOfDay, startOfDay } from 'date-fns'
import { User, Where } from 'payload'
import { UserRolesEnum } from '@/features/users'
import { getAccessibleOrgIdsForUser } from '@/shared'
import { SocialMediasCollectionSlug } from '@/features/social-medias'
import {
  createUserForQueriesFromCookie,
  getSelectedTenantIdFromCookie,
} from '@/app/(dashboard)/server-tenant-context'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
import { ComplianceTask, Flag } from '@/types/payload-types'

export const getFlags = async ({
  flagType,
  status,
  organizations,
  lastActivityFrom,
  lastActivityTo,
  detectionDateFrom,
  detectionDateTo,
  tenant,
  pageSize,
  pageIndex,
}: {
  flagType?: string[]
  status?: FlagStatusEnum[]
  organizations?: number[]
  lastActivityFrom: string
  lastActivityTo: string
  detectionDateFrom: string
  detectionDateTo: string
  tenant?: number[]
  pageSize: number
  pageIndex: number
}) => {
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
  const effectiveRole = getEffectiveRoleFromUser(userForQueries)
  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin
  const selectedTenantId = await getSelectedTenantIdFromCookie()

  const lastActivity: Record<string, string | Date> = {}

  if (lastActivityFrom) {
    lastActivity.greater_than_equal = startOfDay(new Date(lastActivityFrom))
  }
  if (lastActivityTo) {
    lastActivity.less_than_equal = endOfDay(new Date(lastActivityTo))
  }

  const detectionDate: Record<string, string | Date> = {}

  if (detectionDateFrom) {
    detectionDate.greater_than_equal = startOfDay(new Date(detectionDateFrom))
  }

  if (detectionDateTo) {
    detectionDate.less_than_equal = endOfDay(new Date(detectionDateTo))
  }

  const where: Where = {
    ...(flagType && flagType?.length > 0 && { flagType: { in: flagType } }),
    ...(status && status?.length > 0 && { status: { in: status } }),
    ...(organizations && organizations.length > 0 && { organizations: { in: organizations } }),
    ...(Object.keys(lastActivity).length > 0 && { lastActivity }),
    ...(Object.keys(detectionDate).length > 0 && { detectionDate }),
  }

  if (!isSuperAdmin) {
    const tenantId =
      typeof userForQueries.tenant === 'object' ? userForQueries.tenant?.id : userForQueries.tenant
    if (tenantId) {
      where.tenant = { equals: tenantId }
    }
  } else if (selectedTenantId !== null) {
    where.tenant = { equals: selectedTenantId }
  }

  if (tenant && tenant.length > 0) {
    where.tenant = { in: tenant }
  }

  switch (effectiveRole) {
    case UserRolesEnum.SuperAdmin:
    case UserRolesEnum.CentralAdmin:
      break

    case UserRolesEnum.UnitAdmin: {
      const accessibleOrgIds = await getAccessibleOrgIdsForUser(
        userForQueries as unknown as User,
        selectedTenantId,
      )
      if (accessibleOrgIds.length > 0) {
        const andConditions = where.and ? [...where.and] : []
        andConditions.push({ organizations: { in: accessibleOrgIds } })
        where.and = andConditions
      } else {
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
      break
    }

    case UserRolesEnum.SocialMediaManager: {
      const socialMedias = await payload.find({
        collection: SocialMediasCollectionSlug,
        where: {
          socialMediaManagers: { in: [userForQueries.id] },
        },
        limit: 0,
        depth: 0,
      })

      const socialMediaIds = socialMedias.docs.map((sm) => sm.id)

      const socialMediaOrgIds = socialMedias.docs
        .map((sm) => (typeof sm.organization === 'number' ? sm.organization : sm.organization?.id))
        .filter((id): id is number => Boolean(id))

      const allFlags = await payload.find({
        collection: FlagsCollectionSlug,
        limit: 0,
        where,
        depth: 1,
        overrideAccess: true,
      })

      const relevantFlags = allFlags.docs.filter((flag) => {
        const flagOrgIds = Array.isArray(flag.organizations)
          ? flag.organizations.map((org) => (typeof org === 'number' ? org : org.id))
          : []

        const hasOrgAccess = flagOrgIds.some((orgId) => socialMediaOrgIds.includes(orgId))

        if (!hasOrgAccess) return false
        if (!flag.affectedEntity || typeof flag.affectedEntity !== 'object') {
          return true
        }

        const { relationTo, value } = flag.affectedEntity as {
          relationTo: string
          value: number | { id: number }
        }

        const entityId = typeof value === 'number' ? value : value.id

        if (relationTo === 'social-medias') {
          return socialMediaIds.includes(entityId)
        }
        if (relationTo === 'users') {
          return entityId === userForQueries.id
        }

        return true
      })

      const startIndex = pageIndex * pageSize
      const endIndex = startIndex + pageSize
      const paginatedFlags = relevantFlags.slice(startIndex, endIndex)

      return {
        docs: paginatedFlags,
        totalDocs: relevantFlags.length,
        hasNextPage: endIndex < relevantFlags.length,
        hasPrevPage: pageIndex > 0,
        totalPages: Math.ceil(relevantFlags.length / pageSize),
        limit: pageSize,
        page: pageIndex + 1,
        pagingCounter: startIndex + 1,
        prevPage: pageIndex > 0 ? pageIndex : null,
        nextPage: endIndex < relevantFlags.length ? pageIndex + 2 : null,
      }
    }

    default:
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

  const flags = await payload.find({
    collection: FlagsCollectionSlug,
    limit: pageSize,
    page: pageIndex + 1,
    where,
    depth: 1,
    overrideAccess: true,
  })
  return flags
}

interface CategoryData {
  count: number
  data: Flag[] | ComplianceTask[]
}

interface DashboardData {
  accessManagement: CategoryData
  security: CategoryData
  policiesTraining: CategoryData
  flaggedIssues: CategoryData
}

export const getFlagInfoForDashboard = async (): Promise<DashboardData> => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
    return {
      accessManagement: { count: 0, data: [] },
      security: { count: 0, data: [] },
      policiesTraining: { count: 0, data: [] },
      flaggedIssues: { count: 0, data: [] },
    }
  }

  const selectedTenantId = await getSelectedTenantIdFromCookie()
  const effectiveRole = getEffectiveRoleFromUser(user)

  let taskWhere: Where = {
    status: { in: ['PENDING', 'OVERDUE'] },
  }

  switch (effectiveRole) {
    case UserRolesEnum.SocialMediaManager:
      taskWhere = {
        and: [taskWhere, { assignedUser: { equals: user.id } }],
      }
      break

    case UserRolesEnum.UnitAdmin: {
      const accessibleOrgIds = await getAccessibleOrgIdsForUser(user, selectedTenantId)
      const usersInOrgs = await payload.find({
        collection: 'users',
        where: {
          organizations: { in: accessibleOrgIds },
        },
        limit: 0,
      })
      const userIds = usersInOrgs.docs.map((u) => u.id)
      taskWhere = {
        and: [taskWhere, { assignedUser: { in: userIds } }],
      }
      break
    }

    case UserRolesEnum.CentralAdmin: {
      const tenantId = typeof user.tenant === 'object' ? user.tenant?.id : user.tenant
      if (tenantId) {
        taskWhere = {
          and: [taskWhere, { tenant: { equals: tenantId } }],
        }
      }
      break
    }

    case UserRolesEnum.SuperAdmin:
      if (selectedTenantId !== null) {
        taskWhere = {
          and: [taskWhere, { tenant: { equals: selectedTenantId } }],
        }
      }
      break
  }

  const complianceTasks = await payload.find({
    collection: 'compliance_tasks',
    where: taskWhere,
    limit: 0,
    overrideAccess: true,
  })

  const accessManagementTasks = complianceTasks.docs.filter((t) => t.type === 'USER_ROLL_CALL')

  const securityTasks = complianceTasks.docs.filter(
    (t) =>
      t.type === 'CONFIRM_USER_PASSWORD' ||
      t.type === 'CONFIRM_SHARED_PASSWORD' ||
      t.type === 'CONFIRM_2FA',
  )

  const policiesTrainingTasks = complianceTasks.docs.filter(
    (t) => t.type === 'POLICY_ACKNOWLEDGMENT' || t.type === 'TRAINING_COMPLETION',
  )

  let flagWhere: Where = {
    and: [
      {
        flagType: {
          in: [
            FlagTypeEnum.SECURITY_CONCERN,
            FlagTypeEnum.OPERATIONAL_ISSUE,
            FlagTypeEnum.OTHER,
            'OVERDUE_COMPLIANCE_TASK',
            'OVERDUE_SECURITY_TASK',
          ],
        },
      },
      {
        status: { not_equals: FlagStatusEnum.RESOLVED },
      },
    ],
  }

  switch (effectiveRole) {
    case UserRolesEnum.SocialMediaManager: {
      const socialMedias = await payload.find({
        collection: SocialMediasCollectionSlug,
        where: {
          socialMediaManagers: { in: [user.id] },
        },
        limit: 0,
      })

      const socialMediaIds = socialMedias.docs.map((sm) => sm.id)

      flagWhere = {
        and: [
          flagWhere,
          {
            or: [
              {
                'affectedEntity.relationTo': { equals: 'social-medias' },
                'affectedEntity.value': { in: socialMediaIds },
              },
              {
                'affectedEntity.relationTo': { equals: 'users' },
                'affectedEntity.value': { equals: user.id },
              },
            ],
          },
        ],
      }
      break
    }
    case UserRolesEnum.UnitAdmin: {
      const accessibleOrgIds = await getAccessibleOrgIdsForUser(user, selectedTenantId)
      flagWhere = {
        and: [flagWhere, { 'organizations.id': { in: accessibleOrgIds } }],
      }
      break
    }
    case UserRolesEnum.CentralAdmin: {
      const tenantId = typeof user.tenant === 'object' ? user.tenant?.id : user.tenant

      if (tenantId) {
        flagWhere = {
          and: [flagWhere, { tenant: { equals: tenantId } }],
        }
      }
      break
    }
    case UserRolesEnum.SuperAdmin:
      if (selectedTenantId !== null) {
        flagWhere = {
          and: [flagWhere, { tenant: { equals: selectedTenantId } }],
        }
      }
      break
    default:
      flagWhere = { id: { equals: -1 } }
      break
  }

  const flaggedIssues = await payload.find({
    collection: FlagsCollectionSlug,
    where: flagWhere,
    depth: 1,
    overrideAccess: true,
    limit: 0,
  })

  return {
    accessManagement: {
      count: accessManagementTasks.length,
      data: accessManagementTasks,
    },
    security: {
      count: securityTasks.length,
      data: securityTasks,
    },
    policiesTraining: {
      count: policiesTrainingTasks.length,
      data: policiesTrainingTasks,
    },
    flaggedIssues: {
      count: flaggedIssues.totalDocs,
      data: flaggedIssues.docs,
    },
  }
}
