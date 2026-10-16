import { vi } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import type { OrganizationAccess } from '@/types/payload-types'

/** The shared Payload double plus the `auth` method that `getAuthUser` calls. */
export const createAuthPayload = () => Object.assign(createFakePayload(), { auth: vi.fn() })

export type AuthPayload = ReturnType<typeof createAuthPayload>

export const buildOrganizationAccess = (
  overrides: Partial<OrganizationAccess> = {},
): OrganizationAccess => ({
  id: 1,
  organization: 100,
  user: 1,
  type: 'permanent',
  start_date: null,
  end_date: null,
  createdAt: '2026-09-01T14:30:00.000Z',
  updatedAt: '2026-09-01T14:30:00.000Z',
  ...overrides,
})

export const pageOf = <T>(docs: T[]) => ({
  docs,
  totalDocs: docs.length,
  totalPages: 1,
  page: 1,
  limit: 10,
  hasNextPage: false,
  hasPrevPage: false,
})

/** Mimics Next's redirect(): it never returns, it throws a control-flow error. */
export const redirectError = (url: string) => new Error(`NEXT_REDIRECT:${url}`)
