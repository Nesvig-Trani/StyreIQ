import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { AcknowledgmentsCollectionSlug, PoliciesCollectionSlug } from '../../schemas'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import {
  createUserForQueriesFromCookie,
  getSelectedTenantIdFromCookie,
} from '@/app/(dashboard)/server-tenant-context'
import { UserRolesEnum } from '@/features/users'
import { Where } from 'payload'
import { extractTenantId } from '@/features/tenants/plugins/collections/helpers/access-control-helpers'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

export const getLastPolicyVersion = async () => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) return null

  const userForQueries = await createUserForQueriesFromCookie(user)
  const selectedTenantId = await getSelectedTenantIdFromCookie()

  const where: Where = {}

  const effectiveRole = getEffectiveRoleFromUser(user)
  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin

  if (isSuperAdmin) {
    if (selectedTenantId !== null) {
      where.tenant = { equals: selectedTenantId }
    } else {
      return null
    }
  } else {
    const userTenantId = extractTenantId(user)
    if (!userTenantId) return null

    where.tenant = { equals: userTenantId }
  }

  const { docs: [lastPolicy] = [] } = await payload.find({
    collection: PoliciesCollectionSlug,
    where,
    sort: '-version',
    limit: 1,
    overrideAccess: isSuperAdmin,
    user: userForQueries,
  })

  return lastPolicy ?? null
}

export const getPolicies = async () => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) return { docs: [] }

  const userForQueries = await createUserForQueriesFromCookie(user)
  const selectedTenantId = await getSelectedTenantIdFromCookie()
  const effectiveRole = getEffectiveRoleFromUser(user)
  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin
  const where: Where = {}

  const emptyResult = {
    docs: [],
    totalDocs: 0,
    limit: 0,
    totalPages: 0,
    page: 1,
    pagingCounter: 1,
    hasPrevPage: false,
    hasNextPage: false,
  }

  let tenantId: number | null

  if (isSuperAdmin) {
    tenantId = selectedTenantId
  } else {
    tenantId = extractTenantId(user)
  }

  if (!tenantId) {
    return emptyResult
  }

  where.tenant = { equals: tenantId }

  return await payload.find({
    collection: PoliciesCollectionSlug,
    where,
    overrideAccess: isSuperAdmin,
    user: userForQueries,
  })
}

export const hasUserAcknowledged = async ({
  userId,
  lastVersionId,
}: {
  userId: number
  lastVersionId: number
}) => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) return false

  const userForQueries = await createUserForQueriesFromCookie(user)

  const acceptedVersion = await payload.find({
    collection: AcknowledgmentsCollectionSlug,
    limit: 1,
    sort: 'version',
    where: {
      user: { equals: userId },
      policy: { equals: lastVersionId },
    },
    overrideAccess: false,
    user: userForQueries,
  })

  return acceptedVersion.docs?.length > 0
}
