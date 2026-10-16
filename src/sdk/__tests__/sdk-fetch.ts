import { afterEach, beforeEach, vi } from 'vitest'

export const BASE_URL = 'https://app.styreiq.test'

export const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** A response whose body is not JSON, e.g. a gateway error page. */
export const htmlResponse = (status: number) =>
  new Response('<html>Bad gateway</html>', { status, headers: { 'Content-Type': 'text/html' } })

/** Replaces the global `fetch` (the network boundary) for the duration of each test. */
export const setupFetchMock = () => {
  const fetchMock = vi.fn<typeof fetch>()
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  const lastCall = () => {
    const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]
    return {
      url: String(url),
      init: init ?? {},
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    }
  }
  return { fetchMock, lastCall }
}
