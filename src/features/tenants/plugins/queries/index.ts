import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { UserRolesEnum } from '@/shared/constants/user-roles'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { Where } from 'payload'
import {
  getSelectedTenantIdFromCookie,
  createUserForQueriesFromCookie,
} from '@/app/(dashboard)/server-tenant-context'
import { extractTenantId } from '../collections/helpers/access-control-helpers'

export const getTenants = async ({
  tenantIds,
  pageSize,
  pageIndex,
}: {
  tenantIds?: number[]
  pageSize: number
  pageIndex: number
}) => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
    return { docs: [], totalDocs: 0, totalPages: 0, page: 1, limit: pageSize }
  }

  const userForQueries = await createUserForQueriesFromCookie(user)
  const selectedTenantId = await getSelectedTenantIdFromCookie()

  let where: Where = {
    ...(tenantIds && tenantIds.length > 0 && { id: { in: tenantIds } }),
  }

  switch (user.role) {
    case UserRolesEnum.SuperAdmin: {
      if (selectedTenantId !== null) {
        where.id = { equals: selectedTenantId }
      }
      break
    }
    case UserRolesEnum.CentralAdmin: {
      const tenantId = extractTenantId(user)

      if (!tenantId) {
        return { docs: [], totalDocs: 0, totalPages: 0, page: 1, limit: pageSize }
      }

      where = {
        ...where,
        id: { equals: tenantId },
      }
      break
    }
    default:
      break
  }

  const tenants = await payload.find({
    collection: 'tenants',
    limit: pageSize,
    page: pageIndex + 1,
    where,
    depth: 1,
    overrideAccess: user.role === UserRolesEnum.SuperAdmin,
    user: userForQueries,
  })

  return tenants
}

export const getTenantById = async ({ id }: { id: number }) => {
  const { payload } = await getPayloadContext()

  const tenant = await payload.findByID({
    collection: 'tenants',
    id: id,
  })

  return tenant
}
