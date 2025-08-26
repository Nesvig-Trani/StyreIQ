import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { FlagsCollectionSlug } from '../types'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { FlagStatusEnum, FlagTypeEnum } from '@/features/flags/schemas'
import { endOfDay, startOfDay } from 'date-fns'
import { Where } from 'payload'
import { Flag } from '@/types/payload-types'

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

  const flags = await payload.find({
    collection: FlagsCollectionSlug,
    limit: pageSize,
    page: pageIndex + 1,
    where,
    depth: 1,
    overrideAccess: false,
    user,
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
  const flags = await payload.find({
    collection: FlagsCollectionSlug,
    where: {},
    depth: 0,
    overrideAccess: false,
    user,
  })

  console.log('flags', flags)

  const securityFlags = flags.docs.filter(
    (f) =>
      f.flagType === FlagTypeEnum.SECURITY_RISK ||
      f.flagType === FlagTypeEnum.MISSING_2FA ||
      f.flagType === FlagTypeEnum.OUTDATED_PASSWORD,
  )

  const complianceFlags = flags.docs.filter(
    (f) =>
      f.flagType === FlagTypeEnum.INCOMPLETE_TRAINING ||
      f.flagType === FlagTypeEnum.UNACKNOWLEDGED_POLICIES,
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
