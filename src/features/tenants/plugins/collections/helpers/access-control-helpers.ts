import { UserRolesEnum } from '@/features/users'
import { getAccessibleOrgIdsForUserWithPayload } from '@/shared'
import { Tenant } from '@/types/payload-types'
import { Access, CollectionSlug, PayloadRequest, User, Where } from 'payload'

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

export function normalizeUserTenant(user: User): User {
  const tenantId = extractTenantId(user)
  return { ...user, tenant: tenantId } as User
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
  if (req.user?.role === UserRolesEnum.SuperAdmin) {
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

  if (req.user?.role === UserRolesEnum.SuperAdmin) {
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

  const { role } = user

  if (role === UserRolesEnum.SuperAdmin) return true

  const tenantId = extractTenantId(user)
  if (!tenantId) return false

  return { tenant: { equals: tenantId } }
}

export const organizationBasedReadAccess: Access = async ({ req }): Promise<boolean | Where> => {
  const { user, payload } = req
  if (!user) return false

  const { role } = user

  if (role === UserRolesEnum.SuperAdmin) return true

  const tenantId = extractTenantId(user)
  if (!tenantId) return false

  switch (role) {
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

  const { role, id } = user

  if (role === UserRolesEnum.SuperAdmin) return true

  const tenantId = extractTenantId(user)
  if (!tenantId) return false

  switch (role) {
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
      return {
        and: [
          { tenant: { equals: tenantId } },
          {
            or: [{ affectedEntity: { equals: id } }, { organizations: { in: accessibleOrgIds } }],
          },
        ],
      }
    }

    default:
      return false
  }
}

export const adminOnlyCreateAccess: Access = async ({ req }) => {
  const { user } = req
  if (!user) return false

  const { role } = user

  switch (role) {
    case UserRolesEnum.SuperAdmin:
    case UserRolesEnum.CentralAdmin:
      return true
    default:
      return false
  }
}

export const managerCreateAccess: Access = async ({ req }) => {
  const { user } = req
  if (!user) return false

  const { role } = user

  switch (role) {
    case UserRolesEnum.SuperAdmin:
    case UserRolesEnum.CentralAdmin:
    case UserRolesEnum.UnitAdmin:
      return true
    default:
      return false
  }
}

export const tenantValidatedCreateAccess: Access = async ({ req, data }) => {
  const { user } = req
  if (!user) return false

  const { role } = user

  if (role === UserRolesEnum.SuperAdmin) return true

  const tenantId = extractTenantId(user)
  if (!tenantId) return false

  if (data?.tenant && data.tenant !== tenantId) return false

  switch (role) {
    case UserRolesEnum.CentralAdmin:
      return true
    default:
      return false
  }
}

export const tenantCreateAccess: Access = ({ req: { user }, data }) => {
  if (!user) return false

  const { role } = user

  if (role === UserRolesEnum.SuperAdmin) return true

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

  const { role } = user

  switch (role) {
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

  const { role } = user

  switch (role) {
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

    const { role } = user

    if (role === UserRolesEnum.SuperAdmin) return true

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

      switch (role) {
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

    const { role, id: userId } = user

    if (role === UserRolesEnum.SuperAdmin) return true

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

  return user.role === UserRolesEnum.SuperAdmin
}

export const tenantValidatedDeleteAccess = (collectionSlug: CollectionSlug): Access => {
  return async ({ req, id }) => {
    const { user, payload } = req
    if (!user || !id || typeof id !== 'string') return false

    const { role } = user

    if (role === UserRolesEnum.SuperAdmin) return true

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

      switch (role) {
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
