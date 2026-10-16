import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CompleteTaskPage from '@/app/(dashboard)/dashboard/compliance/[taskType]/[taskId]/page'
import CreateUnitPage from '@/app/(dashboard)/dashboard/units/create/page'
import CreateRoleRequestPage from '@/app/(dashboard)/dashboard/role-request/create/page'
import CreateSocialMediaPage from '@/app/(dashboard)/dashboard/social-media-accounts/create/page'
import UpdateGovernanceSettingsPage from '@/app/(dashboard)/dashboard/tenants/update-governance-settings/[tenantId]/page'
import { TenantProvider } from '@/features/tenants/contexts/tenant-context'
import { buildComplianceTask, buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import {
  buildOrganizationAccess,
  createAuthPayload,
  pageOf,
} from '@/features/auth/__tests__/auth-boundaries'
import { buildTenant, redirectError } from '../app-fixtures'

const payload = createAuthPayload()

vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined }),
}))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
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

const taskParams = (taskType: string, taskId = '21') => Promise.resolve({ taskType, taskId })

// jsdom has no ResizeObserver, which Radix form controls rely on.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  payload.auth.mockReset()
  payload.find.mockReset()
  payload.findByID.mockReset().mockResolvedValue(buildTenant())
  payload.create.mockReset().mockResolvedValue({ id: 1 })
  givenCollections()
})

afterEach(() => vi.unstubAllGlobals())

describe('complete compliance task page', () => {
  it('should send an anonymous visitor to login', async () => {
    payload.auth.mockResolvedValue({ user: null })
    await expect(CompleteTaskPage({ params: taskParams('training') })).rejects.toThrow(
      redirectError('/login'),
    )
  })

  it('should answer not found when the task does not belong to the user', async () => {
    signIn(manager)
    givenCollections({ compliance_tasks: [] })
    await expect(CompleteTaskPage({ params: taskParams('training') })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    )
  })

  it('should answer not found for an unknown task type', async () => {
    signIn(manager)
    givenCollections({ compliance_tasks: [buildComplianceTask({ id: 21 })] })
    await expect(CompleteTaskPage({ params: taskParams('time-travel') })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    )
  })

  it('should look the task up by id and assignee', async () => {
    signIn(manager)
    givenCollections({ compliance_tasks: [buildComplianceTask({ id: 21, assignedUser: 4 })] })
    render(await CompleteTaskPage({ params: taskParams('2fa') }))
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'compliance_tasks',
        where: { and: [{ id: { equals: 21 } }, { assignedUser: { equals: 4 } }] },
      }),
    )
  })

  it.each([
    ['password-setup', 'Password & 2FA Setup'],
    ['user-password', 'Confirm Personal Password Update'],
    ['shared-password', 'Confirm Shared Account Password Update'],
    ['training', 'About this training'],
  ])('should render the %s form for the assigned task', async (taskType, expectedText) => {
    signIn(manager)
    givenCollections({
      compliance_tasks: [
        buildComplianceTask({ id: 21, assignedUser: 4, relatedTraining: 'training-risk' }),
      ],
    })
    render(await CompleteTaskPage({ params: taskParams(taskType) }))
    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })
})

describe('create unit page', () => {
  it('should ask anonymous visitors to log in', async () => {
    payload.auth.mockResolvedValue({ user: null })
    render(await CreateUnitPage())
    expect(screen.getByText('You must be logged in to view this page.')).toBeInTheDocument()
  })

  it('should show the creation form once units exist', async () => {
    signIn(superAdmin)
    givenCollections({ organization: [buildOrganization({ name: 'Dirección de Comunicaciones' })] })
    render(await CreateUnitPage())
    expect(screen.getByRole('heading', { name: 'Create Unit', level: 1 })).toBeInTheDocument()
  })
})

describe('create role request page', () => {
  it('should offer the request form to a user that can still request roles', async () => {
    signIn(manager)
    render(await CreateRoleRequestPage())
    expect(screen.getByRole('heading', { name: 'Request Additional Role' })).toBeInTheDocument()
    expect(screen.queryByText('You already have all available roles')).not.toBeInTheDocument()
  })

  it('should tell a user who already holds every requestable role', async () => {
    signIn(buildUser({ roles: ['central_admin', 'unit_admin', 'social_media_manager'] }))
    render(await CreateRoleRequestPage())
    expect(screen.getByText('You already have all available roles')).toBeInTheDocument()
    expect(screen.getByText(/Current roles: central admin, unit admin/)).toBeInTheDocument()
  })
})

describe('create social media account page', () => {
  it('should show the account form with its breadcrumbs', async () => {
    signIn(manager)
    render(await CreateSocialMediaPage())
    expect(
      screen.getByRole('heading', { name: 'Create Social Media Account', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Social Media' })).toHaveAttribute(
      'href',
      '/dashboard/social-media-accounts',
    )
  })

  it('should send a visitor without a role back to the accounts list', async () => {
    payload.auth.mockResolvedValue({ user: null })
    await expect(CreateSocialMediaPage()).rejects.toThrow(
      redirectError('/dashboard/social-media-accounts'),
    )
  })
})

describe('update governance settings page', () => {
  const render_ = async (tenantId: string) =>
    render(
      <TenantProvider user={superAdmin}>
        {await UpdateGovernanceSettingsPage({ params: Promise.resolve({ tenantId }) })}
      </TenantProvider>,
    )

  it('should show a 404 when the tenant does not exist', async () => {
    payload.findByID.mockResolvedValue(null)
    await render_('999')
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
  })

  it('should show the governance settings form for an existing tenant', async () => {
    payload.findByID.mockResolvedValue(buildTenant({ id: 10 }))
    await render_('10')
    expect(screen.getByRole('heading', { name: 'Governance Settings' })).toBeInTheDocument()
  })
})
