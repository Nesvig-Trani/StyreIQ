import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
import { UserRolesEnum } from '@/features/users/schemas'
import { Where } from 'payload'
import { extractTenantId } from '@/features/tenants/plugins/collections/helpers/access-control-helpers'
import { getSelectedTenantIdFromCookie } from '@/app/(dashboard)/server-tenant-context'
import { RoleRequestStatus } from '../../schemas'

export const getRoleRequests = async (params?: {
  status?: RoleRequestStatus
  tenant?: number[]
  pageSize?: number
  pageIndex?: number
}) => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const effectiveRole = getEffectiveRoleFromUser(user)
  const where: Where = {}

  switch (effectiveRole) {
    case UserRolesEnum.SuperAdmin: {
      const selectedTenantId = await getSelectedTenantIdFromCookie()
      if (selectedTenantId !== null) {
        where.tenant = { equals: selectedTenantId }
      }
      break
    }

    case UserRolesEnum.CentralAdmin: {
      const tenantId = extractTenantId(user)

      if (!tenantId) {
        throw new Error('User has no tenant assigned')
      }

      where.tenant = { equals: tenantId }
      break
    }

    case UserRolesEnum.UnitAdmin:
    case UserRolesEnum.SocialMediaManager: {
      const tenantId = extractTenantId(user)

      if (!tenantId) {
        throw new Error('User has no tenant assigned')
      }

      where.and = [{ user: { equals: user.id } }, { tenant: { equals: tenantId } }]
      break
    }

    default:
      throw new Error('User does not have permission to view role requests')
      break
  }

  if (params?.tenant && params.tenant.length > 0) {
    where.tenant = { in: params.tenant }
  }

  if (params?.status) {
    where.status = { equals: params.status }
  }

  return payload.find({
    collection: 'role-requests',
    where,
    limit: params?.pageSize || 10,
    page: (params?.pageIndex || 0) + 1,
    sort: '-createdAt',
  })
}
