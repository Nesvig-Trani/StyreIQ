import type { AuditLog, SocialMedia, Tenant } from '@/types/payload-types'
import { buildUser } from '@/shared/__tests__/fixtures'

export const buildAuditLog = (overrides: Partial<AuditLog> = {}): AuditLog => ({
  id: 1,
  user: buildUser({
    id: 7,
    name: 'Valentina Restrepo',
    email: 'valentina.restrepo@universidad-andina.edu',
  }),
  action: 'update',
  entity: 'users',
  createdAt: '2026-09-15T16:45:00.000Z',
  updatedAt: '2026-09-15T16:45:00.000Z',
  ...overrides,
})

export const buildSocialMediaAccount = (overrides: Partial<SocialMedia> = {}): SocialMedia => ({
  id: 8,
  name: 'Instagram Universidad Andina',
  profileUrl: 'https://www.instagram.com/uandina_oficial',
  platform: 'instagram',
  organization: 100,
  socialMediaManagers: [3],
  primaryAdmin: 1,
  status: 'active',
  tenant: 10,
  createdAt: '2026-09-01T14:30:00.000Z',
  updatedAt: '2026-09-01T14:30:00.000Z',
  ...overrides,
})

export const buildTenant = (overrides: Partial<Tenant> = {}): Tenant => ({
  id: 10,
  name: 'Universidad Andina',
  domain: 'universidad-andina.edu',
  adminContactName: 'Rodrigo Salcedo',
  adminContactEmail: 'rodrigo.salcedo@universidad-andina.edu',
  status: 'active',
  createdAt: '2026-09-01T14:30:00.000Z',
  updatedAt: '2026-09-01T14:30:00.000Z',
  ...overrides,
})
