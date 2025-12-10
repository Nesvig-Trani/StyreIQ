import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { AcknowledgmentsCollectionSlug, PoliciesCollectionSlug } from '../../schemas'

import { normalizeUserTenant } from '@/features/tenants/plugins/collections/helpers/access-control-helpers'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'

export const getLastPolicyVersion = async () => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) return null

  const userWithTenantId = normalizeUserTenant(user)

  const { docs: [lastPolicy] = [] } = await payload.find({
    collection: PoliciesCollectionSlug,
    sort: '-version',
    limit: 1,
    overrideAccess: false,
    user: userWithTenantId,
  })

  return lastPolicy ?? null
}

export const getPolicies = async () => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) return { docs: [] }

  const userWithTenantId = normalizeUserTenant(user)

  return await payload.find({
    collection: PoliciesCollectionSlug,
    overrideAccess: false,
    user: userWithTenantId,
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

  const userWithTenantId = normalizeUserTenant(user)

  const acceptedVersion = await payload.find({
    collection: AcknowledgmentsCollectionSlug,
    limit: 1,
    sort: 'version',
    where: {
      user: { equals: userId },
      policy: { equals: lastVersionId },
    },
    overrideAccess: false,
    user: userWithTenantId,
  })

  return acceptedVersion.docs?.length > 0
}
