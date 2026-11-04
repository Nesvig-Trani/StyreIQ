import type { Payload } from 'payload'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { WelcomeEmailCollectionSlug } from '../types'

// Server-only on purpose (no 'use server'): exported server actions are publicly callable.
// The local API skips collection access control, so the tenant must be filtered explicitly.
// Without a tenant there is no welcome email: never fall back to another tenant's content.
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
