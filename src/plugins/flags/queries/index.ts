import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { FlagsCollectionSlug } from '@/plugins/flags/types'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { FlagStatusEnum } from '@/flags/schemas'
import { endOfDay, startOfDay } from 'date-fns'
import { Where } from 'payload'

export const getFlags = async ({
  flagType,
  status,
  organization,
  lastActivityFrom,
  lastActivityTo,
  detectionDateFrom,
  detectionDateTo,
  pageSize,
  pageIndex,
}: {
  flagType?: string[]
  status?: FlagStatusEnum[]
  organization?: number
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
    ...(organization && { organization: { in: organization } }),
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
