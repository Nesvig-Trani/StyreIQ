import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { FlagsCollectionSlug } from '@/plugins/flags/types'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { FlagStatusEnum, FlagTypeEnum } from '@/flags/schemas'
import { endOfDay, startOfDay } from 'date-fns'
import { Where } from 'payload'

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

interface FlagsData {
  security: number
  compliance: number
  activity: number
  legal: number
  incident: number
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
  return {
    security: flags.docs.filter(
      (f) =>
        f.flagType === FlagTypeEnum.SECURITY_RISK ||
        f.flagType === FlagTypeEnum.MISSING_2FA ||
        f.flagType === FlagTypeEnum.OUTDATED_PASSWORD,
    ).length,
    compliance: flags.docs.filter(
      (f) =>
        f.flagType === FlagTypeEnum.INCOMPLETE_TRAINING ||
        f.flagType === FlagTypeEnum.UNACKNOWLEDGED_POLICIES,
    ).length,
    activity: flags.docs.filter(
      (f) =>
        f.flagType === FlagTypeEnum.INACTIVE_ACCOUNT ||
        f.flagType === FlagTypeEnum.NO_ASSIGNED_OWNER,
    ).length,
    legal: flags.docs.filter((f) => f.flagType === FlagTypeEnum.LEGAL_NOT_CONFIRMED).length,
    incident: flags.docs.filter((f) => f.flagType === FlagTypeEnum.INCIDENT_OPEN).length,
  }
}
