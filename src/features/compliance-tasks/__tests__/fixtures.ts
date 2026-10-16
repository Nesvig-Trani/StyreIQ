import type { SocialMedia, Tenant } from '@/types/payload-types'

const TIMESTAMP = '2026-09-01T14:30:00.000Z'

export const buildTenant = (overrides: Partial<Tenant> = {}): Tenant => ({
  id: 10,
  name: 'Universidad Andina',
  domain: 'universidad-andina.edu',
  adminContactName: 'Camila Ortega',
  adminContactEmail: 'camila.ortega@universidad-andina.edu',
  status: 'active',
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
})

export const buildSocialMedia = (overrides: Partial<SocialMedia> = {}): SocialMedia => ({
  id: 1,
  name: 'Admisiones Universidad Andina',
  profileUrl: 'https://instagram.com/admisiones.andina',
  platform: 'instagram',
  accountHandle: 'admisiones.andina',
  organization: 100,
  socialMediaManagers: [7],
  primaryAdmin: 20,
  status: 'active',
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
})
