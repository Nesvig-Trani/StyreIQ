import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import UsersPage from '@/app/(dashboard)/dashboard/users/page'
import CreateUserPage from '@/app/(dashboard)/dashboard/users/create/page'
import UpdateUserPage from '@/app/(dashboard)/dashboard/users/update/[id]/page'
import CreateTenantPage from '@/app/(dashboard)/dashboard/tenants/create/page'
import UpdateTenantPage from '@/app/(dashboard)/dashboard/tenants/update/[tenantId]/page'
import CreateFlagPage from '@/app/(dashboard)/dashboard/flags/create/page'
import { TenantProvider } from '@/features/tenants/contexts/tenant-context'
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
const centralAdmin = buildUser({ id: 3, roles: ['central_admin'], tenant: 10 })
const socialMediaManager = buildUser({ id: 4, roles: ['social_media_manager'], tenant: 10 })

const signIn = (user: ReturnType<typeof buildUser>) => payload.auth.mockResolvedValue({ user })

const givenCollections = (docs: Record<string, unknown[]> = {}) =>
  payload.find.mockImplementation(async ({ collection }: { collection: string }) =>
    pageOf(
      docs[collection] ?? (collection === 'organization_access' ? [buildOrganizationAccess()] : []),
    ),
  )

beforeEach(() => {
  payload.auth.mockReset()
  payload.find.mockReset()
  payload.findByID.mockReset().mockResolvedValue(buildTenant())
  givenCollections()
})

describe('users page', () => {
  it('should ask anonymous visitors to log in', async () => {
    payload.auth.mockResolvedValue({ user: null })
    render(await UsersPage({}))
    expect(screen.getByText('You must be logged in to access this page.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Users' })).not.toBeInTheDocument()
  })

  it('should list users and offer creation inside a tenant for a central admin', async () => {
    signIn(centralAdmin)
    givenCollections({ users: [buildUser({ id: 9, name: 'Camilo Ospina' })] })
    render(await UsersPage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Create User/ })).toHaveAttribute(
      'href',
      '/dashboard/users/create',
    )
    expect(screen.getByRole('link', { name: 'Review user requests' })).toHaveAttribute(
      'href',
      '/dashboard/review-requests',
    )
  })

  it('should flag the all-tenants view for a super admin without offering creation', async () => {
    signIn(superAdmin)
    givenCollections({ tenants: [buildTenant()] })
    render(await UsersPage({}))
    expect(screen.getByText('All Tenants')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Create User/ })).not.toBeInTheDocument()
  })
})

describe('create user page', () => {
  it('should show the creation form with breadcrumbs for a central admin', async () => {
    signIn(centralAdmin)
    render(await CreateUserPage())
    expect(screen.getByRole('heading', { name: 'Create User' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/dashboard/users')
  })

  it('should deny access to a social media manager', async () => {
    signIn(socialMediaManager)
    render(await CreateUserPage())
    expect(screen.queryByRole('heading', { name: 'Create User' })).not.toBeInTheDocument()
  })
})

describe('update user page', () => {
  it('should show a 404 when the user does not exist', async () => {
    signIn(centralAdmin)
    payload.findByID.mockResolvedValue(null)
    render(await UpdateUserPage({ params: Promise.resolve({ id: '999' }) }))
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
  })

  it('should ask anonymous visitors to log in', async () => {
    payload.auth.mockResolvedValue({ user: null })
    render(await UpdateUserPage({ params: Promise.resolve({ id: '9' }) }))
    expect(screen.getByText('You must be logged in to access this page.')).toBeInTheDocument()
  })
})

describe('tenant form pages', () => {
  it('should show the create tenant form', async () => {
    render(<TenantProvider user={superAdmin}>{await CreateTenantPage()}</TenantProvider>)
    expect(screen.getByRole('heading', { name: 'Create Tenant' })).toBeInTheDocument()
  })

  it('should show a 404 when the tenant to update does not exist', async () => {
    payload.findByID.mockResolvedValue(null)
    render(await UpdateTenantPage({ params: Promise.resolve({ tenantId: '999' }) }))
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
  })

  it('should show the update form for an existing tenant', async () => {
    payload.findByID.mockResolvedValue(buildTenant({ id: 10, name: 'Universidad Andina' }))
    render(
      <TenantProvider user={superAdmin}>
        {await UpdateTenantPage({ params: Promise.resolve({ tenantId: '10' }) })}
      </TenantProvider>,
    )
    expect(screen.getByRole('heading', { name: 'Update Tenant' })).toBeInTheDocument()
    expect(screen.getByText(/for Universidad Andina\./)).toBeInTheDocument()
  })
})

describe('create flag page', () => {
  it('should show the risk flag form', async () => {
    signIn(centralAdmin)
    render(await CreateFlagPage())
    expect(screen.getByRole('heading', { name: 'Create Risk Flag', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Risk Flags' })).toHaveAttribute(
      'href',
      '/dashboard/flags',
    )
  })
})
