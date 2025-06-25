import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { AcknowledgmentsCollectionSlug, PoliciesCollectionSlug } from '../schemas'

export const getLastPolicyVersion = async () => {
  const { payload } = await getPayloadContext()

  const { docs: [lastPolicy] = [] } = await payload.find({
    collection: PoliciesCollectionSlug,
    sort: '-version',
    limit: 1,
  })

  return lastPolicy ?? null
}

export const getPolicies = async () => {
  const { payload } = await getPayloadContext()
  const policies = await payload.find({
    collection: PoliciesCollectionSlug,
  })
  return policies
}

export const hasUserAcknowledged = async ({
  userId,
  lastVersionId,
}: {
  userId: number
  lastVersionId: number
}) => {
  const { payload } = await getPayloadContext()

  const acceptedVersion = await payload.find({
    collection: AcknowledgmentsCollectionSlug,
    limit: 1,
    sort: 'version',
    where: {
      user: { equals: userId },
      policy: { equals: lastVersionId },
    },
  })

  return acceptedVersion.docs?.length > 0
}
