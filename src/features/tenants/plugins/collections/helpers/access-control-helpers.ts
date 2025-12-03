import { UserRolesEnum } from '@/features/users'
import { getAccessibleOrgIdsForUserWithPayload } from '@/shared'
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

export function extractTenantId(tenant: number | HasId | null | undefined): number | null {
  if (!tenant) return null
  if (hasId(tenant)) return tenant.id
  return typeof tenant === 'number' ? tenant : null
}

export function getTenantWhereClause(user: User): Where {
  return {
    tenant: { equals: user.tenant },
  }
}

export function validateTenantAccess({
  req,
  targetTenantId,
  entityName = 'resource',
}: ValidateTenantOptions): {
  valid: boolean
  error?: { message: string; status: number }
  userTenant?: string | number
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

  const userTenantId = extractTenantId(req.user.tenant)
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
    userTenant: userTenantId!,
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
    const entityTenantId = extractTenantId(entityTenant)
    const userTenantId = extractTenantId(req.user?.tenant)

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

  const { role, tenant } = user

  if (role === UserRolesEnum.SuperAdmin) return true
  if (!tenant) return false

  return { tenant: { equals: tenant } }
}

export const organizationBasedReadAccess: Access = async ({ req }): Promise<boolean | Where> => {
  const { user, payload } = req
  if (!user) return false

  const { role, tenant } = user

  if (role === UserRolesEnum.SuperAdmin) return true
  if (!tenant) return false

  switch (role) {
    case UserRolesEnum.CentralAdmin:
      return { tenant: { equals: tenant } }

    case UserRolesEnum.UnitAdmin: {
      const accessibleOrgIds = await getAccessibleOrgIdsForUserWithPayload(user, payload)
      return {
        and: [{ tenant: { equals: tenant } }, { organizations: { in: accessibleOrgIds } }],
      }
    }

    default:
      return false
  }
}

export const socialMediaManagerReadAccess: Access = async ({ req }): Promise<boolean | Where> => {
  const { user, payload } = req
  if (!user) return false

  const { role, tenant, id } = user

  if (role === UserRolesEnum.SuperAdmin) return true
  if (!tenant) return false

  switch (role) {
    case UserRolesEnum.CentralAdmin:
      return { tenant: { equals: tenant } }

    case UserRolesEnum.UnitAdmin: {
      const accessibleOrgIds = await getAccessibleOrgIdsForUserWithPayload(user, payload)
      return {
        and: [{ tenant: { equals: tenant } }, { organizations: { in: accessibleOrgIds } }],
      }
    }

    case UserRolesEnum.SocialMediaManager: {
      const accessibleOrgIds = await getAccessibleOrgIdsForUserWithPayload(user, payload)
      return {
        and: [
          { tenant: { equals: tenant } },
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

  const { role, tenant } = user

  if (role === UserRolesEnum.SuperAdmin) return true
  if (!tenant) return false

  if (data?.tenant && data.tenant !== tenant) return false

  switch (role) {
    case UserRolesEnum.CentralAdmin:
      return true
    default:
      return false
  }
}

export const tenantCreateAccess: Access = ({ req: { user }, data }) => {
  if (!user) return false

  const { role, tenant } = user

  if (role === UserRolesEnum.SuperAdmin) return true
  if (!tenant) return false

  if (data?.tenant && data.tenant !== tenant) return false

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

    const { role, tenant } = user

    if (role === UserRolesEnum.SuperAdmin) return true

    try {
      const targetDoc = await payload.findByID({
        collection: collectionSlug,
        id: id as string,
      })

      if (!targetDoc) return false

      if ('tenant' in targetDoc && targetDoc.tenant !== tenant) return false
      if (data?.tenant && data.tenant !== tenant) return false

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

    const { role, tenant } = user

    if (role === UserRolesEnum.SuperAdmin) return true

    try {
      const targetDoc = await payload.findByID({
        collection: collectionSlug,
        id: id as string,
      })

      if (!targetDoc) return false

      if ('tenant' in targetDoc && targetDoc.tenant !== tenant) return false

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
