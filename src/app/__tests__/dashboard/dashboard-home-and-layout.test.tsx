import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage from '@/app/(dashboard)/dashboard/page'
import DashboardLayout from '@/app/(dashboard)/layout'
import { buildUser } from '@/shared/__tests__/fixtures'
import {
  buildOrganizationAccess,
  createAuthPayload,
  pageOf,
} from '@/features/auth/__tests__/auth-boundaries'
import { buildTenant, redirectError } from '../app-fixtures'

const payload = createAuthPayload()
const jobsRun = Object.assign(payload.jobs, { run: vi.fn().mockResolvedValue(undefined) }).run

vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined }),
}))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: payload.asPayload() }),
}))

const superAdmin = buildUser({ id: 2, roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({ id: 3, roles: ['central_admin'], tenant: 10 })
const manager = buildUser({ id: 4, roles: ['social_media_manager'], tenant: 10 })

const signIn = (user: ReturnType<typeof buildUser>) => payload.auth.mockResolvedValue({ user })

const givenCollections = (docs: Record<string, unknown[]> = {}) =>
  payload.find.mockImplementation(async ({ collection }: { collection: string }) =>
    pageOf(
      docs[collection] ?? (collection === 'organization_access' ? [buildOrganizationAccess()] : []),
    ),
  )

// jsdom lacks these browser APIs, which the sidebar and Radix controls rely on.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  payload.auth.mockReset()
  payload.find.mockReset()
  payload.count.mockReset().mockResolvedValue({ totalDocs: 0 })
  payload.findByID.mockReset().mockResolvedValue(buildTenant())
  payload.jobs.queue.mockClear()
  jobsRun.mockClear()
  givenCollections()
})
afterEach(() => vi.unstubAllGlobals())

describe('dashboard page', () => {
  it('should send an anonymous visitor to login', async () => {
    payload.auth.mockResolvedValue({ user: null })
    payload.find.mockResolvedValue({ ...pageOf([]), totalDocs: 3 })
    await expect(DashboardPage()).rejects.toThrow(redirectError('/login'))
  })

  it('should send a visitor to the first-user setup on a fresh installation', async () => {
    payload.auth.mockResolvedValue({ user: null })
    await expect(DashboardPage()).rejects.toThrow(redirectError('/login/create-first-user'))
  })

  it('should show the summary sections to a social media manager', async () => {
    signIn(manager)
    render(await DashboardPage())
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Total Accounts')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Risk Categories' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Account Status Overview' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create Account' })).toHaveAttribute(
      'href',
      '/dashboard/social-media-accounts/create',
    )
    expect(screen.queryByText('All Tenants')).not.toBeInTheDocument()
  })

  it('should mark the all-tenants view for a super admin and hide account creation', async () => {
    signIn(superAdmin)
    givenCollections({ tenants: [buildTenant()] })
    render(await DashboardPage())
    expect(screen.getAllByText('All Tenants').length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: 'Create Account' })).not.toBeInTheDocument()
  })
})

describe('dashboard layout', () => {
  const renderLayout = async () =>
    render(await DashboardLayout({ children: <p>Contenido del panel</p> }))

  it('should send an anonymous visitor to login', async () => {
    payload.auth.mockResolvedValue({ user: null })
    payload.find.mockResolvedValue({ ...pageOf([]), totalDocs: 3 })
    await expect(DashboardLayout({ children: <p>x</p> })).rejects.toThrow(redirectError('/login'))
  })

  it('should wrap the page content in the sidebar shell', async () => {
    signIn(centralAdmin)
    await renderLayout()
    expect(screen.getByText('Contenido del panel')).toBeInTheDocument()
    expect(document.getElementById('main-content')).not.toBeNull()
  })

  it('should queue and run the risk detection job on every visit', async () => {
    signIn(centralAdmin)
    await renderLayout()
    expect(payload.jobs.queue).toHaveBeenCalledWith({ task: 'detectRisks', input: {} })
    expect(jobsRun).toHaveBeenCalledOnce()
  })

  it('should load the tenant of the signed-in user', async () => {
    signIn(centralAdmin)
    await renderLayout()
    expect(payload.findByID).toHaveBeenCalledWith({ collection: 'tenants', id: 10 })
  })
})
