import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/logout/route'
import { SELECTED_TENANT_COOKIE_NAME } from '@/features/tenants/schemas'

const cookieStore = vi.hoisted(() => ({ set: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }))

const requestFor = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(`https://app.styreiq.test${path}`, { headers })

beforeEach(() => cookieStore.set.mockReset())

describe('GET /api/logout', () => {
  it('should expire the session and selected-tenant cookies and redirect to login', async () => {
    const response = await GET(requestFor('/api/logout'))

    expect(cookieStore.set).toHaveBeenCalledWith(
      'payload-token',
      '',
      expect.objectContaining({ maxAge: 0, httpOnly: true, path: '/' }),
    )
    expect(cookieStore.set).toHaveBeenCalledWith(
      SELECTED_TENANT_COOKIE_NAME,
      '',
      expect.objectContaining({ maxAge: 0, path: '/' }),
    )
    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location') ?? '').pathname).toBe('/login')
  })

  it('should forbid caching and ask the browser to clear site data', async () => {
    const response = await GET(requestFor('/api/logout'))
    expect(response.headers.get('Cache-Control')).toContain('no-store')
    expect(response.headers.get('Pragma')).toBe('no-cache')
    expect(response.headers.get('Expires')).toBe('0')
    expect(response.headers.get('Clear-Site-Data')).toBe('"cookies", "storage"')
  })

  it('should pass a known logout reason on to the login page', async () => {
    const response = await GET(requestFor('/api/logout?reason=no-unit-access'))
    const location = new URL(response.headers.get('location') ?? '')
    expect(location.searchParams.get('reason')).toBe('no-unit-access')
  })

  it('should drop an unknown logout reason', async () => {
    const response = await GET(requestFor('/api/logout?reason=<script>'))
    const location = new URL(response.headers.get('location') ?? '')
    expect(location.searchParams.has('reason')).toBe(false)
  })

  it('should answer router RSC fetches with an empty 204 and keep the cookies', async () => {
    const response = await GET(requestFor('/api/logout', { rsc: '1' }))
    expect(response.status).toBe(204)
    expect(cookieStore.set).not.toHaveBeenCalled()
  })
})
