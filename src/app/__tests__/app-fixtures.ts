import type { Tenant } from '@/types/payload-types'

const TIMESTAMP = '2026-09-01T14:30:00.000Z'

export const buildTenant = (overrides: Partial<Tenant> = {}): Tenant => ({
  id: 10,
  name: 'Universidad Andina',
  domain: 'universidad-andina.edu',
  adminContactName: 'Valentina Restrepo',
  adminContactEmail: 'valentina.restrepo@universidad-andina.edu',
  status: 'active',
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
})

/** Mimics Next's redirect()/notFound(): they never return, they throw a control-flow error. */
export const redirectError = (url: string) => new Error(`NEXT_REDIRECT:${url}`)
