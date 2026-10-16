import type { ComplianceTask, Flag, Organization, User } from '@/types/payload-types'

const TIMESTAMP = '2026-09-01T14:30:00.000Z'

export const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  name: 'Valentina Restrepo',
  email: 'valentina.restrepo@universidad-andina.edu',
  roles: ['social_media_manager'],
  admin_policy_agreement: true,
  status: 'active',
  tenant: 10,
  organizations: [],
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
})

export const buildOrganization = (overrides: Partial<Organization> = {}): Organization => ({
  id: 100,
  name: 'Dirección de Comunicaciones',
  type: 'office',
  status: 'active',
  path: '/100',
  depth: 0,
  tenant: 10,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
})

export const buildFlag = (overrides: Partial<Flag> = {}): Flag => ({
  id: 1,
  status: 'pending',
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
})

export const buildComplianceTask = (overrides: Partial<ComplianceTask> = {}): ComplianceTask => ({
  id: 1,
  type: 'POLICY_ACKNOWLEDGMENT',
  assignedUser: 1,
  status: 'PENDING',
  dueDate: '2026-10-30T00:00:00.000Z',
  tenant: 10,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
})
