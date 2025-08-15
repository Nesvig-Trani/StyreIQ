import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { Where } from 'payload'
import { endOfDay, startOfDay } from 'date-fns'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'

export const getAuditLogs = async ({
  entity,
  action,
  userId,
  from,
  to,
  pageSize,
  pageIndex,
}: {
  entity: string[]
  action: string[]
  userId: number
  from: string
  to: string
  pageSize: number
  pageIndex: number
}) => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  const createdAt: Record<string, string | Date> = {}
  if (from) {
    createdAt.greater_than_equal = startOfDay(new Date(from))
  }
  if (to) {
    createdAt.less_than_equal = endOfDay(new Date(to))
  }

  const where: Where = {
    ...(entity.length > 0 && { entity: { in: entity } }),
    ...(action.length > 0 && { action: { in: action } }),
    ...(userId && { user: { equals: userId } }),
    ...(Object.keys(createdAt).length > 0 && { createdAt }),
  }

  const auditLogs = await payload.find({
    collection: 'audit_log',
    depth: 1,
    limit: pageSize,
    page: pageIndex + 1,
    where,
    overrideAccess: false,
    user,
  })

  return auditLogs
}

export const getSocialMediaAuditLogs = async ({
  socialMediaId,
  action,
  userId,
}: {
  socialMediaId: number
  action?: string[]
  userId?: number
}) => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  const createdAt: Record<string, string | Date> = {}

  const where: Where = {
    entity: { equals: 'social-medias' },
    ...(action && action.length > 0 && { action: { in: action } }),
    ...(userId && { user: { equals: userId } }),
    ...(Object.keys(createdAt).length > 0 && { createdAt }),
    or: [{ 'current.id': { equals: socialMediaId } }, { 'prev.id': { equals: socialMediaId } }],
  }

  const auditLogs = await payload.find({
    collection: 'audit_log',
    depth: 1,
    where,
    overrideAccess: false,
    user,
  })

  return auditLogs
}
