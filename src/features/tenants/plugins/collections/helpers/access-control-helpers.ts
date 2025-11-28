import { UserRolesEnum } from '@/features/users'
import { getAccessibleOrgIdsForUserWithPayload } from '@/shared'
import { Access, CollectionSlug, User, Where } from 'payload'

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

export const validateTenantAccess = (user: User, tenant: string | number): boolean => {
  if (user.role === UserRolesEnum.SuperAdmin) return true
  return user.tenant === tenant
}

export const getTenantWhereClause = (user: User): Where => {
  return { tenant: { equals: user.tenant } }
}
