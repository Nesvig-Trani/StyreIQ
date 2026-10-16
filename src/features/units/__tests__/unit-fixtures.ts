import { vi } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'

/** The shared Payload double plus the `auth` method that `getAuthUser` calls. */
export const createAuthPayload = () => Object.assign(createFakePayload(), { auth: vi.fn() })

export const pageOf = <T>(docs: T[]) => ({
  docs,
  totalDocs: docs.length,
  totalPages: 1,
  page: 1,
  limit: 10,
  hasNextPage: false,
  hasPrevPage: false,
})
