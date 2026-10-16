import type { FlagComment, FlagHistory, SocialMedia } from '@/types/payload-types'

const TIMESTAMP = '2026-09-01T14:30:00.000Z'

export const buildSocialMedia = (overrides: Partial<SocialMedia> = {}): SocialMedia => ({
  id: 31,
  name: 'Facultad de Artes - Instagram',
  profileUrl: 'https://instagram.com/uandina_artes',
  platform: 'instagram',
  organization: 100,
  socialMediaManagers: [5],
  primaryAdmin: 7,
  status: 'active',
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
})

export const buildFlagComment = (overrides: Partial<FlagComment> = {}): FlagComment => ({
  id: 301,
  comment: 'Ya contacté al administrador anterior',
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
})

export const buildFlagHistory = (overrides: Partial<FlagHistory> = {}): FlagHistory => ({
  id: 401,
  action: 'created',
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
})

export const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
