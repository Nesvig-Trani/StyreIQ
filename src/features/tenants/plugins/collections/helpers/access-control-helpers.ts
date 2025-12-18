import { SELECTED_TENANT_COOKIE_NAME } from '@/features/tenants/schemas'
import { UserRolesEnum } from '@/features/users'
import { getAccessibleOrgIdsForUserWithPayload } from '@/shared'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
import { Tenant } from '@/types/payload-types'
import {
  Access,
  CollectionAfterDeleteHook,
  CollectionSlug,
  FieldHook,
  PayloadRequest,
  User,
  Where,
} from 'payload'

interface HasId {
  id: number
}
interface ValidateTenantOptions {
  req: PayloadRequest
  targetTenantId?: string | number | null
  entityName?: string
}

interface ValidateRelatedEntityOptions {
  req: PayloadRequest
  collection: string
  entityId: string | number
  entityName?: string
}

function hasId(value: unknown): value is HasId {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as HasId).id === 'number'
  )
}

export function extractTenantId(user: User | null | undefined): number | null {
  if (!user || !user.tenant) return null

  const tenantId =
    typeof user.tenant === 'object' && user.tenant !== null ? user.tenant.id : user.tenant

  if (!tenantId || tenantId === 'NaN' || isNaN(Number(tenantId))) {
    return null
  }

  return Number(tenantId)
}

export function extractTenantIdFromProperty(
  tenant: number | Tenant | null | undefined,
): number | null {
  if (!tenant) return null

  if (typeof tenant === 'number') {
    return tenant
  }

  if (typeof tenant === 'object' && tenant !== null && 'id' in tenant) {
    return tenant.id
  }

  return null
}

export function validateTenantAccess({
  req,
  targetTenantId,
  entityName = 'resource',
}: ValidateTenantOptions): {
  valid: boolean
  error?: { message: string; status: number }
  userTenant?: number | null
} {
  const effectiveRole = getEffectiveRoleFromUser(req.user)
  if (effectiveRole) {
    return { valid: true }
  }

  if (!req.user?.tenant) {
    return {
      valid: false,
      error: {
        message: 'User has no tenant assigned',
        status: 400,
      },
    }
  }

  const userTenantId = extractTenantId(req.user)
  const targetId = targetTenantId

  if (targetId && targetId !== userTenantId) {
    return {
      valid: false,
      error: {
        message: `Cannot access ${entityName} from different tenant`,
        status: 403,
      },
    }
  }

  return {
    valid: true,
    userTenant: userTenantId,
  }
}

export async function validateRelatedEntityTenant({
  req,
  collection,
  entityId,
  entityName = 'entity',
}: ValidateRelatedEntityOptions): Promise<{
  valid: boolean
  error?: { message: string; status: number }
  entity?: unknown
}> {
  const entity = await req.payload.findByID({
    collection: collection as CollectionSlug,
    id: entityId,
  })

  if (!entity) {
    return {
      valid: false,
      error: {
        message: `${entityName} not found`,
        status: 404,
      },
    }
  }

  const effectiveRole = getEffectiveRoleFromUser(req.user)
  if (effectiveRole === UserRolesEnum.SuperAdmin) {
    return { valid: true, entity }
  }

  if ('tenant' in entity) {
    const entityTenant = entity.tenant as number | HasId | null | undefined
    const entityTenantId = hasId(entityTenant) ? entityTenant.id : entityTenant
    const userTenantId = extractTenantId(req.user)

    if (entityTenantId !== userTenantId) {
      return {
        valid: false,
        error: {
          message: `${entityName} belongs to different tenant`,
          status: 400,
        },
      }
    }
  }

  return { valid: true, entity }
}

export const tenantBasedReadAccess: Access = async ({ req }): Promise<boolean | Where> => {
  const { user } = req
  if (!user) return false

  const effectiveRole = getEffectiveRoleFromUser(user)

  if (effectiveRole === UserRolesEnum.SuperAdmin) return true

  const tenantId = extractTenantId(user)
  if (!tenantId) return false

  return { tenant: { equals: tenantId } }
}

export const organizationBasedReadAccess: Access = async ({ req }): Promise<boolean | Where> => {
  const { user, payload } = req
  if (!user) return false

  const effectiveRole = getEffectiveRoleFromUser(user)

  if (effectiveRole === UserRolesEnum.SuperAdmin) return true

  const tenantId = extractTenantId(user)
  if (!tenantId) return false

  switch (effectiveRole) {
    case UserRolesEnum.CentralAdmin:
      return { tenant: { equals: tenantId } }

    case UserRolesEnum.UnitAdmin: {
      const accessibleOrgIds = await getAccessibleOrgIdsForUserWithPayload(user, payload)
      return {
        and: [{ tenant: { equals: tenantId } }, { organizations: { in: accessibleOrgIds } }],
      }
    }

    default:
      return false
  }
}

export const socialMediaManagerReadAccess: Access = async ({ req }): Promise<boolean | Where> => {
  const { user, payload } = req
  if (!user) return false

  const effectiveRole = getEffectiveRoleFromUser(user)
  if (effectiveRole === UserRolesEnum.SuperAdmin) return true

  const tenantId = extractTenantId(user)
  if (!tenantId) return false

  switch (effectiveRole) {
    case UserRolesEnum.CentralAdmin:
      return { tenant: { equals: tenantId } }

    case UserRolesEnum.UnitAdmin: {
      const accessibleOrgIds = await getAccessibleOrgIdsForUserWithPayload(user, payload)
      return {
        and: [{ tenant: { equals: tenantId } }, { organizations: { in: accessibleOrgIds } }],
      }
    }
    case UserRolesEnum.SocialMediaManager: {
      const accessibleOrgIds = await getAccessibleOrgIdsForUserWithPayload(user, payload)

      if (accessibleOrgIds.length === 0) {
        return false
      }

      return {
        and: [{ tenant: { equals: tenantId } }, { organizations: { in: accessibleOrgIds } }],
      }
    }

    default:
      return false
  }
}

export const adminOnlyCreateAccess: Access = async ({ req, data }) => {
  const { user } = req
  if (!user) return false

  const effectiveRole = getEffectiveRoleFromUser(user)

  switch (effectiveRole) {
    case UserRolesEnum.SuperAdmin: {
      const selectedTenantId = getSelectedTenantFromRequest(req)
      const dataTenantId = data?.tenant ? extractTenantIdFromProperty(data.tenant) : null
      if (!dataTenantId && !selectedTenantId) {
        return false
      }

      return true
    }
    case UserRolesEnum.CentralAdmin: {
      const tenantId = extractTenantId(user)
      if (!tenantId) return false

      const dataTenantId = data?.tenant ? extractTenantIdFromProperty(data.tenant) : null

      if (dataTenantId && dataTenantId !== tenantId) {
        return false
      }

      return true
    }
    default:
      return false
  }
}

export const managerCreateAccess: Access = async ({ req, data }) => {
  const { user } = req
  if (!user) return false

  const effectiveRole = getEffectiveRoleFromUser(user)

  switch (effectiveRole) {
    case UserRolesEnum.SuperAdmin: {
      const selectedTenantId = getSelectedTenantFromRequest(req)
      const dataTenantId = data?.tenant ? extractTenantIdFromProperty(data.tenant) : null
      if (!dataTenantId && !selectedTenantId) {
        return false
      }
      return true
    }
    case UserRolesEnum.CentralAdmin:
    case UserRolesEnum.UnitAdmin:
      return true
    default:
      return false
  }
}

export const tenantCreateAccess: Access = ({ req, data }) => {
  if (!req.user) return false

  const { user } = req
  const effectiveRole = getEffectiveRoleFromUser(user)

  if (effectiveRole === UserRolesEnum.SuperAdmin) {
    const selectedTenantId = getSelectedTenantFromRequest(req)
    const dataTenantId = data?.tenant ? extractTenantIdFromProperty(data.tenant) : null
    if (!dataTenantId && !selectedTenantId) {
      return false
    }
    return true
  }

  const tenantId = extractTenantId(user)
  if (!tenantId) return false

  if (data?.tenant && data.tenant !== tenantId) return false

  return true
}

export const authenticatedCreateAccess: Access = async ({ req }) => {
  return !!req.user
}

export const adminOnlyUpdateAccess: Access = async ({ req }) => {
  const { user } = req
  if (!user) return false

  const effectiveRole = getEffectiveRoleFromUser(user)

  switch (effectiveRole) {
    case UserRolesEnum.SuperAdmin:
    case UserRolesEnum.CentralAdmin:
      return true
    default:
      return false
  }
}

export const managerUpdateAccess: Access = async ({ req }) => {
  const { user } = req
  if (!user) return false

  const effectiveRole = getEffectiveRoleFromUser(user)

  switch (effectiveRole) {
    case UserRolesEnum.SuperAdmin:
    case UserRolesEnum.CentralAdmin:
    case UserRolesEnum.UnitAdmin:
      return true
    default:
      return false
  }
}

export const tenantValidatedUpdateAccess = (collectionSlug: CollectionSlug): Access => {
  return async ({ req, id, data }) => {
    const { user, payload } = req
    if (!user || !id || typeof id !== 'string') return false

    const effectiveRole = getEffectiveRoleFromUser(user)

    if (effectiveRole === UserRolesEnum.SuperAdmin) return true

    const tenantId = extractTenantId(user)
    if (!tenantId) return false

    try {
      const targetDoc = await payload.findByID({
        collection: collectionSlug,
        id: id as string,
      })

      if (!targetDoc) return false

      const targetTenantId =
        'tenant' in targetDoc
          ? extractTenantId({ tenant: targetDoc.tenant } as unknown as User)
          : null

      if (targetTenantId && targetTenantId !== tenantId) return false
      if (data?.tenant && data.tenant !== tenantId) return false

      switch (effectiveRole) {
        case UserRolesEnum.CentralAdmin:
          return true
        default:
          return false
      }
    } catch {
      return false
    }
  }
}

export const ownerUpdateAccess = (collectionSlug: CollectionSlug): Access => {
  return async ({ req, id }) => {
    const { user, payload } = req
    if (!user || !id || typeof id !== 'string') return false

    const { id: userId } = user
    const effectiveRole = getEffectiveRoleFromUser(user)
    if (effectiveRole === UserRolesEnum.SuperAdmin) return true

    try {
      const doc = await payload.findByID({
        collection: collectionSlug,
        id: id as string,
      })

      return doc && 'user' in doc && doc.user === userId
    } catch {
      return false
    }
  }
}

export const immutableUpdateAccess: Access = async () => false

export const superAdminOnlyDeleteAccess: Access = async ({ req }) => {
  const { user } = req
  if (!user) return false
  const effectiveRole = getEffectiveRoleFromUser(user)
  return effectiveRole === UserRolesEnum.SuperAdmin
}

export const tenantValidatedDeleteAccess = (collectionSlug: CollectionSlug): Access => {
  return async ({ req, id }) => {
    const { user, payload } = req
    if (!user || !id || typeof id !== 'string') return false

    const effectiveRole = getEffectiveRoleFromUser(user)

    if (effectiveRole === UserRolesEnum.SuperAdmin) return true

    const tenantId = extractTenantId(user)
    if (!tenantId) return false

    try {
      const targetDoc = await payload.findByID({
        collection: collectionSlug,
        id: id as string,
      })

      if (!targetDoc) return false

      const targetTenantId =
        'tenant' in targetDoc
          ? extractTenantId({ tenant: targetDoc.tenant } as unknown as User)
          : null

      if (targetTenantId && targetTenantId !== tenantId) return false

      switch (effectiveRole) {
        case UserRolesEnum.CentralAdmin:
          return true
        default:
          return false
      }
    } catch {
      return false
    }
  }
}

export const getSelectedTenantFromRequest = (
  req: Parameters<FieldHook>[0]['req'],
): number | null => {
  const cookieHeader = req.headers?.get?.('cookie') || ''

  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, string>,
  )

  const selectedTenantId = cookies[SELECTED_TENANT_COOKIE_NAME]

  if (!selectedTenantId) return null

  const tenantId = parseInt(selectedTenantId, 10)
  return isNaN(tenantId) ? null : tenantId
}

export const getTenantIdForAuditLog = (
  req: Parameters<CollectionAfterDeleteHook>[0]['req'],
  doc: Record<string, unknown>,
): number | null => {
  const user = req.user
  const effectiveRole = getEffectiveRoleFromUser(user)
  if (!user) return null

  if (doc.tenant) {
    if (typeof doc.tenant === 'object' && doc.tenant !== null && 'id' in doc.tenant) {
      return (doc.tenant as { id: number }).id
    }
    if (typeof doc.tenant === 'number') {
      return doc.tenant
    }
  }

  if (effectiveRole === UserRolesEnum.SuperAdmin) {
    return getSelectedTenantFromRequest(req)
  }

  return extractTenantId(user)
}
