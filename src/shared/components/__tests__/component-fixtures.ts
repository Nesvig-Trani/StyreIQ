import type { Organization, Tenant, User } from '@/types/payload-types'
import type { UnitWithDepth } from '@/features/units'

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

export const buildUnitWithDepth = (
  organization: Organization,
  parentOrg: Organization,
  admin: User | null = null,
): UnitWithDepth => ({
  ...organization,
  parentOrg,
  admin,
  backupAdmins: [],
  children: { docs: [] },
})
