import type { Tenant } from '@/types/payload-types'

export const buildTenant = (overrides: Partial<Tenant> = {}): Tenant => ({
  id: 10,
  name: 'Universidad Andina',
  domain: 'universidad-andina.edu',
  adminContactName: 'Camila Ortega',
  adminContactEmail: 'camila.ortega@universidad-andina.edu',
  status: 'active',
  createdAt: '2026-09-01T14:30:00.000Z',
  updatedAt: '2026-09-01T14:30:00.000Z',
  ...overrides,
})
