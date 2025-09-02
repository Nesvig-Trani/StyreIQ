import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { Where } from 'payload'
import { endOfDay, startOfDay } from 'date-fns'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'

type WithId = { id: number }

function hasId(value: unknown): value is WithId {
  return typeof value === 'object' && value !== null && 'id' in value
}

type EntityType = 'users' | 'organization' | 'social-medias'

export const getAuditLogs = async ({
  entity,
  action,
  userId,
  from,
  to,
  userDocumentId,
  organizationDocumentId,
  socialMediaDocumentId,
  pageSize,
  pageIndex,
}: {
  entity: string[]
  action: string[]
  userId: number
  from: string
  to: string
  userDocumentId?: number
  organizationDocumentId?: number
  socialMediaDocumentId?: number
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

  const baseLogs = await payload.find({
    collection: 'audit_log',
    depth: 1,
    limit: 0,
    page: pageIndex + 1,
    where: {
      ...(entity.length > 0 && { entity: { in: entity } }),
      ...(action.length > 0 && { action: { in: action } }),
      ...(userId && { user: { equals: userId } }),
      ...(Object.keys(createdAt).length > 0 && { createdAt }),
    },
    overrideAccess: false,
    user,
  })

  const filterByEntityAndId = (entity: EntityType, id: number, docs: typeof baseLogs.docs) =>
    docs.filter(
      (log) => log.entity === entity && hasId(log.document?.value) && log.document.value.id === id,
    )

  let filteredDocs = baseLogs.docs

  if (userDocumentId) {
    filteredDocs = filterByEntityAndId('users', userDocumentId, baseLogs.docs)
  } else if (organizationDocumentId) {
    filteredDocs = filterByEntityAndId('organization', organizationDocumentId, baseLogs.docs)
  } else if (socialMediaDocumentId) {
    filteredDocs = filterByEntityAndId('social-medias', socialMediaDocumentId, baseLogs.docs)
  }

  const startIndex = pageIndex * pageSize
  const endIndex = startIndex + pageSize
  const paginatedDocs = filteredDocs.slice(startIndex, endIndex)

  return {
    ...baseLogs,
    docs: paginatedDocs,
    totalDocs: filteredDocs.length,
    totalPages: Math.ceil(filteredDocs.length / pageSize),
  }
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
