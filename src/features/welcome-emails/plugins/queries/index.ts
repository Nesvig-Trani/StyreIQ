import type { Payload } from 'payload'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { WelcomeEmailCollectionSlug } from '../types'

// No 'use server': exported server actions are publicly callable, and this reads any tenant.
// The local API skips access control, so filter by tenant; no tenant means no content.
export const getWelcomeEmailForTenant = async (
  payload: Payload,
  tenantId: number | null | undefined,
) => {
  if (!tenantId) return undefined

  const welcomeEmail = await payload.find({
    collection: WelcomeEmailCollectionSlug,
    where: { tenant: { equals: tenantId } },
    sort: '-createdAt',
    limit: 1,
  })

  return welcomeEmail.docs[0]
}

export const getLastWelcomeEmail = async (tenantId: number | null | undefined) => {
  const { payload } = await getPayloadContext()
  return getWelcomeEmailForTenant(payload, tenantId)
}
