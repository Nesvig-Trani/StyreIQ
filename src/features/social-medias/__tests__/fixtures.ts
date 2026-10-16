import type { SocialMedia, SocialMediaPost } from '@/types/payload-types'

const TIMESTAMP = '2026-09-01T14:30:00.000Z'

export const buildSocialMedia = (overrides: Partial<SocialMedia> = {}): SocialMedia => ({
  id: 7,
  name: 'Universidad Andina Oficial',
  profileUrl: 'https://www.instagram.com/uandina_oficial',
  platform: 'instagram',
  accountHandle: '@uandina_oficial',
  organization: 100,
  socialMediaManagers: [3],
  primaryAdmin: 1,
  status: 'active',
  tenant: 10,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
})

export const buildSocialMediaPost = (
  overrides: Partial<SocialMediaPost> = {},
): SocialMediaPost => ({
  id: 55,
  platform: 'twitter',
  socialMedia: 7,
  externalId: '1840211223344',
  author: 'Universidad Andina',
  authorId: 'uandina_oficial',
  content: 'Abrimos inscripciones para el semestre 2027-1',
  url: 'https://x.com/uandina_oficial/status/1840211223344',
  publishedAt: '2026-09-20T15:00:00.000Z',
  scrapedAt: TIMESTAMP,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
})
