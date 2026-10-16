import { vi } from 'vitest'
import type { Payload, PayloadRequest } from 'payload'
import type { User } from '@/types/payload-types'

/**
 * Test doubles for the Payload boundary (database + auth), so endpoint, hook and access
 * logic can run for real. Payload's `Payload` and `PayloadRequest` types are huge and
 * cannot be built literally, so the single unavoidable cast lives here and nowhere else.
 */
const EMPTY_PAGE = {
  docs: [],
  totalDocs: 0,
  totalPages: 0,
  page: 1,
  limit: 10,
  hasNextPage: false,
  hasPrevPage: false,
}

export const createFakePayload = () => {
  const fake = {
    find: vi.fn().mockResolvedValue(EMPTY_PAGE),
    findByID: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 1 }),
    update: vi.fn().mockResolvedValue({ id: 1 }),
    delete: vi.fn().mockResolvedValue({ id: 1 }),
    count: vi.fn().mockResolvedValue({ totalDocs: 0 }),
    sendEmail: vi.fn().mockResolvedValue(undefined),
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    jobs: { queue: vi.fn().mockResolvedValue(undefined) },
  }
  return Object.assign(fake, { asPayload: (): Payload => fake as unknown as Payload })
}

export type FakePayload = ReturnType<typeof createFakePayload>

type FakeRequestOptions = {
  user?: User | null
  payload?: FakePayload
  body?: unknown
  query?: Record<string, unknown>
  routeParams?: Record<string, string>
  searchParams?: Record<string, string>
}

export const createFakeRequest = ({
  user = null,
  payload = createFakePayload(),
  body,
  query = {},
  routeParams = {},
  searchParams = {},
}: FakeRequestOptions = {}) => {
  const url = new URL('https://app.styreiq.test/api')
  Object.entries(searchParams).forEach(([key, value]) => url.searchParams.set(key, value))
  const fake = {
    user,
    payload: payload.asPayload(),
    json: body === undefined ? undefined : vi.fn().mockResolvedValue(body),
    query,
    routeParams,
    searchParams: url.searchParams,
    url: url.toString(),
    headers: new Headers(),
    cookies: new Map<string, string>(),
    context: {},
    t: (key: string) => key,
  }
  return { fake, payload, asRequest: (): PayloadRequest => fake as unknown as PayloadRequest }
}
