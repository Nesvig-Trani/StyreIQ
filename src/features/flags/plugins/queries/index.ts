import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { FlagsCollectionSlug } from '../types'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { FlagStatusEnum, FlagTypeEnum } from '@/features/flags/schemas'
import { endOfDay, startOfDay } from 'date-fns'
import { Where } from 'payload'
import { Flag } from '@/types/payload-types'
import { UserRolesEnum } from '@/features/users'
import { getAccessibleOrgIdsForUser } from '@/shared'
import { SocialMediasCollectionSlug } from '@/features/social-medias'
import {
  createUserForQueriesFromCookie,
  getSelectedTenantIdFromCookie,
} from '@/app/(dashboard)/server-tenant-context'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

export const getFlags = async ({
  flagType,
  status,
  organizations,
  lastActivityFrom,
  lastActivityTo,
  detectionDateFrom,
  detectionDateTo,
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

  const effectiveRole = getEffectiveRoleFromUser(user)
  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin
  const userForQueries = await createUserForQueriesFromCookie(user)
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
    ...(organizations && { organizations: { in: organizations } }),
    ...(Object.keys(lastActivity).length > 0 && { lastActivity }),
    ...(Object.keys(detectionDate).length > 0 && { detectionDate }),
  }

  if (isSuperAdmin && selectedTenantId !== null) {
    where.tenant = { equals: selectedTenantId }
  }

  if (effectiveRole === UserRolesEnum.SocialMediaManager) {
    const socialMedias = await payload.find({
      collection: SocialMediasCollectionSlug,
      where: {
        socialMediaManagers: { in: [user.id] },
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
      overrideAccess: false,
      user: userForQueries,
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
        return entityId === user.id
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

  const flags = await payload.find({
    collection: FlagsCollectionSlug,
    limit: pageSize,
    page: pageIndex + 1,
    where,
    depth: 1,
    overrideAccess: isSuperAdmin,
    user: userForQueries,
  })
  return flags
}

interface CategoryData {
  count: number
  data: Flag[]
}

interface FlagsData {
  security: CategoryData
  compliance: CategoryData
  activity: CategoryData
  legal: CategoryData
  incident: CategoryData
}

export const getFlagInfoForDashboard = async (): Promise<FlagsData> => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
    return {
      security: { count: 0, data: [] },
      compliance: { count: 0, data: [] },
      activity: { count: 0, data: [] },
      legal: { count: 0, data: [] },
      incident: { count: 0, data: [] },
    }
  }

  const selectedTenantId = await getSelectedTenantIdFromCookie()

  let where: Where = {}
  const effectiveRole = getEffectiveRoleFromUser(user)

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

      where = {
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
      }
      break
    }
    case UserRolesEnum.UnitAdmin: {
      const accessibleOrgIds = await getAccessibleOrgIdsForUser(user, selectedTenantId)

      where = {
        'organizations.id': { in: accessibleOrgIds },
      }
      break
    }
    case UserRolesEnum.CentralAdmin: {
      const tenantId = typeof user.tenant === 'object' ? user.tenant?.id : user.tenant

      where = tenantId ? { tenant: { equals: tenantId } } : {}

      break
    }
    case UserRolesEnum.SuperAdmin: {
      where = selectedTenantId !== null ? { tenant: { equals: selectedTenantId } } : {}
      break
    }
    default:
      where = { id: { equals: -1 } }
      break
  }

  const flags = await payload.find({
    collection: FlagsCollectionSlug,
    where,
    depth: 0,
    overrideAccess: true,
    user,
    limit: 0,
  })

  const securityFlags = flags.docs.filter(
    (f) =>
      f.flagType === FlagTypeEnum.SECURITY_RISK ||
      f.flagType === FlagTypeEnum.MISSING_2FA ||
      f.flagType === FlagTypeEnum.OUTDATED_PASSWORD,
  )

  const complianceFlags = flags.docs.filter(
    (f) =>
      f.flagType === FlagTypeEnum.INCOMPLETE_TRAINING ||
      f.flagType === FlagTypeEnum.UNACKNOWLEDGED_POLICIES ||
      f.flagType === FlagTypeEnum.INCOMPLETE_OFFBOARDING,
  )

  const activityFlags = flags.docs.filter(
    (f) =>
      f.flagType === FlagTypeEnum.INACTIVE_ACCOUNT || f.flagType === FlagTypeEnum.NO_ASSIGNED_OWNER,
  )

  const legalFlags = flags.docs.filter((f) => f.flagType === FlagTypeEnum.LEGAL_NOT_CONFIRMED)

  const incidentFlags = flags.docs.filter((f) => f.flagType === FlagTypeEnum.INCIDENT_OPEN)

  return {
    security: {
      count: securityFlags.length,
      data: securityFlags,
    },
    compliance: {
      count: complianceFlags.length,
      data: complianceFlags,
    },
    activity: {
      count: activityFlags.length,
      data: activityFlags,
    },
    legal: {
      count: legalFlags.length,
      data: legalFlags,
    },
    incident: {
      count: incidentFlags.length,
      data: incidentFlags,
    },
  }
}
