import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SocialMediasPage from '@/app/(dashboard)/dashboard/social-media-accounts/page'
import UpdateSocialMediaPage from '@/app/(dashboard)/dashboard/social-media-accounts/update/[socialMediaId]/page'
import PoliciesPage from '@/app/(dashboard)/dashboard/policies/page'
import { buildUser } from '@/shared/__tests__/fixtures'
import {
  buildOrganizationAccess,
  createAuthPayload,
  pageOf,
} from '@/features/auth/__tests__/auth-boundaries'
import { buildTenant } from '../app-fixtures'

const payload = createAuthPayload()

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
const manager = buildUser({ id: 4, roles: ['social_media_manager'], tenant: 10 })

const signIn = (user: ReturnType<typeof buildUser>) => payload.auth.mockResolvedValue({ user })

const givenCollections = (docs: Record<string, unknown[]> = {}) =>
  payload.find.mockImplementation(async ({ collection }: { collection: string }) =>
    pageOf(
      docs[collection] ?? (collection === 'organization_access' ? [buildOrganizationAccess()] : []),
    ),
  )

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  payload.auth.mockReset()
  payload.find.mockReset()
  payload.count.mockReset().mockResolvedValue({ totalDocs: 0 })
  payload.findByID.mockReset().mockResolvedValue(buildTenant())
  givenCollections()
})
afterEach(() => vi.unstubAllGlobals())

describe('social media accounts page', () => {
  it('should ask anonymous visitors to log in', async () => {
    payload.auth.mockResolvedValue({ user: null })
    render(
      await SocialMediasPage({ params: Promise.resolve({}), searchParams: Promise.resolve({}) }),
    )
    expect(screen.getByText('You must be logged in to view this page.')).toBeInTheDocument()
  })

  it('should show the accounts list to a manager', async () => {
    signIn(manager)
    render(
      await SocialMediasPage({ params: Promise.resolve({}), searchParams: Promise.resolve({}) }),
    )
    expect(screen.getByRole('heading', { name: /Social Media Accounts/ })).toBeInTheDocument()
  })

  it('should load the tenants for a super admin viewing all tenants', async () => {
    signIn(superAdmin)
    givenCollections({ tenants: [buildTenant()] })
    render(
      await SocialMediasPage({ params: Promise.resolve({}), searchParams: Promise.resolve({}) }),
    )
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'tenants' }))
  })
})

describe('update social media page', () => {
  it('should show a 404 when the account does not exist', async () => {
    signIn(manager)
    payload.findByID.mockResolvedValue(null)
    render(await UpdateSocialMediaPage({ params: Promise.resolve({ socialMediaId: '999' }) }))
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
  })
})

describe('policies page', () => {
  it('should ask a super admin to pick a tenant before editing policies', async () => {
    signIn(superAdmin)
    givenCollections({ tenants: [buildTenant()] })
    render(await PoliciesPage())
    expect(screen.getByText('Viewing All Tenants')).toBeInTheDocument()
    expect(screen.getByText('Select a tenant to manage policies')).toBeInTheDocument()
  })
})
