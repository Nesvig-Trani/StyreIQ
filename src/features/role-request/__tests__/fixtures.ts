import type { RoleRequest, Tenant } from '@/types/payload-types'
import { buildUser } from '@/shared/__tests__/fixtures'

const TIMESTAMP = '2026-09-01T14:30:00.000Z'

export const buildTenant = (overrides: Partial<Tenant> = {}): Tenant => ({
  id: 10,
  name: 'Universidad Andina',
  domain: 'universidad-andina.edu',
  adminContactName: 'Rodrigo Salcedo',
  adminContactEmail: 'rodrigo.salcedo@universidad-andina.edu',
  status: 'active',
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
})

export const buildRoleRequest = (overrides: Partial<RoleRequest> = {}): RoleRequest => ({
  id: 1,
  user: buildUser({ id: 31, name: 'Camila Ortega', email: 'camila.ortega@universidad-andina.edu' }),
  requestedRole: 'unit_admin',
  justification: 'Necesito administrar la Dirección de Comunicaciones durante el semestre.',
  status: 'pending',
  tenant: 10,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
})
