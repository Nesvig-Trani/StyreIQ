import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TenantsPage from '@/app/(dashboard)/dashboard/tenants/page'
import UnitsPage from '@/app/(dashboard)/dashboard/units/page'
import FlagsPage from '@/app/(dashboard)/dashboard/flags/page'
import AuditLogsPage from '@/app/(dashboard)/dashboard/audit-logs/page'
import RoleRequestsPage from '@/app/(dashboard)/dashboard/role-request/page'
import ReviewRequestsPage from '@/app/(dashboard)/dashboard/review-requests/page'
import { buildFlag, buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import {
  createAuthPayload,
  buildOrganizationAccess,
  pageOf,
} from '@/features/auth/__tests__/auth-boundaries'
import { SELECTED_TENANT_COOKIE_NAME } from '@/features/tenants/schemas'
import { buildTenant } from '../app-fixtures'

const payload = createAuthPayload()
const cookieJar = vi.hoisted(() => ({ values: new Map<string, string>() }))

vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.values.get(name)
      return value === undefined ? undefined : { name, value }
    },
  }),
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

const signIn = (user: ReturnType<typeof buildUser>) => payload.auth.mockResolvedValue({ user })

/** Serves each collection from `docs`; every user keeps one permanent unit access. */
const givenCollections = (docs: Record<string, unknown[]> = {}) =>
  payload.find.mockImplementation(async ({ collection }: { collection: string }) =>
    pageOf(
      docs[collection] ?? (collection === 'organization_access' ? [buildOrganizationAccess()] : []),
    ),
  )

beforeEach(() => {
  cookieJar.values.clear()
  payload.auth.mockReset()
  payload.find.mockReset()
  givenCollections()
  payload.findByID.mockReset().mockResolvedValue(buildTenant())
})

describe('tenants page', () => {
  it('should let a super admin create tenants and list the existing ones', async () => {
    signIn(superAdmin)
    givenCollections({ tenants: [buildTenant({ name: 'Universidad Andina' })] })
    render(await TenantsPage({}))
    expect(screen.getByRole('heading', { name: 'Tenants' })).toBeInTheDocument()
    expect(screen.getByText('1 Total Tenants')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Create Tenant/ })).toHaveAttribute(
      'href',
      '/dashboard/tenants/create',
    )
    expect(screen.getByText('Universidad Andina')).toBeInTheDocument()
  })

  it('should not offer tenant creation to other roles', async () => {
    signIn(centralAdmin)
    render(await TenantsPage({ searchParams: Promise.resolve({}) }))
    expect(screen.queryByRole('link', { name: /Create Tenant/ })).not.toBeInTheDocument()
  })
})

describe('review requests page', () => {
  it('should show the heading for pending user requests', async () => {
    signIn(centralAdmin)
    render(await ReviewRequestsPage({}))
    expect(screen.getByRole('heading', { name: 'Review user requests' })).toBeInTheDocument()
  })
})

describe('units page', () => {
  it('should ask anonymous visitors to log in', async () => {
    payload.auth.mockResolvedValue({ user: null })
    render(await UnitsPage({}))
    expect(screen.getByText('You must be logged in to view this page.')).toBeInTheDocument()
  })

  it('should show the unit count and creation link once a super admin selects a tenant', async () => {
    signIn(superAdmin)
    cookieJar.values.set(SELECTED_TENANT_COOKIE_NAME, '10')
    givenCollections({
      tenants: [buildTenant({ id: 10 })],
      organization: [buildOrganization({ name: 'Dirección de Comunicaciones' })],
    })
    render(await UnitsPage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByRole('heading', { name: 'Units' })).toBeInTheDocument()
    expect(screen.getByText('1 Units')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Create Unit/ })).toHaveAttribute(
      'href',
      '/dashboard/units/create',
    )
  })

  it('should hide unit creation while a super admin views all tenants', async () => {
    signIn(superAdmin)
    givenCollections({ tenants: [buildTenant()] })
    render(await UnitsPage({}))
    expect(screen.queryByRole('link', { name: /Create Unit/ })).not.toBeInTheDocument()
  })
})

describe('flags page', () => {
  it('should show the flag count and offer to create one inside a tenant', async () => {
    signIn(centralAdmin)
    givenCollections({ flags: [buildFlag({ flagType: 'missing_2fa' })] })
    render(await FlagsPage({}))
    expect(screen.getByRole('heading', { name: 'Risk Flags' })).toBeInTheDocument()
    expect(screen.getByText('1 Total Flags')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Create Risk Flag/ })).toHaveAttribute(
      'href',
      '/dashboard/flags/create',
    )
  })

  it('should not offer flag creation while viewing all tenants', async () => {
    signIn(superAdmin)
    render(await FlagsPage({ searchParams: Promise.resolve({}) }))
    expect(screen.queryByRole('link', { name: /Create Risk Flag/ })).not.toBeInTheDocument()
  })
})

describe('audit logs page', () => {
  it('should show the number of entries', async () => {
    signIn(centralAdmin)
    render(await AuditLogsPage({}))
    expect(screen.getByRole('heading', { name: 'Audit Log' })).toBeInTheDocument()
    expect(screen.getByText('0 Entries')).toBeInTheDocument()
  })

  it('should load tenants for the filter when a super admin views all tenants', async () => {
    signIn(superAdmin)
    render(await AuditLogsPage({ searchParams: Promise.resolve({}) }))
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'tenants' }))
  })
})

describe('role requests page', () => {
  it('should let a central admin review requests', async () => {
    signIn(centralAdmin)
    render(await RoleRequestsPage({}))
    expect(screen.getByRole('heading', { name: 'Role Requests' })).toBeInTheDocument()
    expect(screen.getByText(/Review and approve role requests/)).toBeInTheDocument()
  })

  it('should let a manager file their own role request', async () => {
    signIn(buildUser({ tenant: 10 }))
    render(await RoleRequestsPage({}))
    expect(screen.getByRole('heading', { name: 'My Role Requests' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Role request/ })).toHaveAttribute(
      'href',
      '/dashboard/role-request/create',
    )
  })
})
