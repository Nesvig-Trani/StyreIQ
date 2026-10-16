import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { TenantProvider } from '@/features/tenants/contexts/tenant-context'
import { CreateTenantForm } from '@/features/tenants/forms/create-tenant-form'
import { UpdateTenantForm } from '@/features/tenants/forms/update-tenant'
import { UpdateTenantSettingsForm } from '@/features/tenants/forms/update-governance-settings'
import { buildUser } from '@/shared/__tests__/fixtures'
import { buildTenant } from '../tenant-fixtures'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  usePathname: () => '/dashboard/tenants',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const fetchMock = vi.fn<typeof fetch>()
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const superAdmin = buildUser({ roles: ['super_admin'], tenant: null })

const withProvider = (ui: React.ReactNode) =>
  render(<TenantProvider user={superAdmin}>{ui}</TenantProvider>)

const callTo = (suffix: string) =>
  fetchMock.mock.calls.find(([url]) => String(url).endsWith(suffix))

beforeEach(() => {
  fetchMock.mockReset()
  push.mockReset()
  vi.mocked(toast.success).mockReset()
  vi.mocked(toast.info).mockReset()
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockImplementation(async (url) =>
    String(url).includes('/available')
      ? jsonResponse(200, { tenants: [] })
      : jsonResponse(200, buildTenant()),
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('CreateTenantForm', () => {
  it('should require the organization details before submitting', async () => {
    withProvider(<CreateTenantForm />)
    await userEvent.click(screen.getByRole('button', { name: /submit|create|save/i }))
    expect(await screen.findByText('Organization name is required')).toBeVisible()
    expect(callTo('/api/tenants')).toBeUndefined()
  })

  it('should create the tenant and return to the tenants list', { timeout: 15000 }, async () => {
    withProvider(<CreateTenantForm />)
    await userEvent.type(screen.getByLabelText(/Organization Name/), 'Universidad Andina')
    await userEvent.type(screen.getByLabelText(/Domain/), 'universidad-andina.edu')
    await userEvent.type(screen.getByLabelText(/Admin Contact Name/), 'Camila Ortega')
    await userEvent.type(
      screen.getByLabelText(/Admin Contact Email/),
      'camila.ortega@universidad-andina.edu',
    )
    await userEvent.click(screen.getByRole('button', { name: /submit|create|save/i }))

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard/tenants'))
    const call = callTo('/api/tenants')
    expect(call?.[1]?.method).toBe('POST')
    expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({
      name: 'Universidad Andina',
      domain: 'universidad-andina.edu',
      metadata: { timezone: 'America/New_York' },
    })
    expect(toast.success).toHaveBeenCalledWith('Tenant created successfully')
  })

  it('should leave without saving when cancelled', async () => {
    withProvider(<CreateTenantForm />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(push).toHaveBeenCalledWith('/dashboard/tenants')
    expect(callTo('/api/tenants')).toBeUndefined()
  })
})

describe('UpdateTenantForm', () => {
  const tenant = buildTenant({ id: 10 })

  it('should prefill the current tenant data', () => {
    withProvider(<UpdateTenantForm tenantId={10} initialData={tenant} />)
    expect(screen.getByLabelText(/Organization Name/)).toHaveValue('Universidad Andina')
    expect(screen.getByLabelText(/Domain/)).toHaveValue('universidad-andina.edu')
  })

  it('should save the changes with a PATCH request', async () => {
    withProvider(<UpdateTenantForm tenantId={10} initialData={tenant} />)
    const name = screen.getByLabelText(/Organization Name/)
    await userEvent.clear(name)
    await userEvent.type(name, 'Universidad Andina de Colombia')
    await userEvent.click(screen.getByRole('button', { name: 'Update Tenant' }))

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard/tenants'))
    const call = callTo('/api/tenants/10')
    expect(call?.[1]?.method).toBe('PATCH')
    expect(JSON.parse(String(call?.[1]?.body)).name).toBe('Universidad Andina de Colombia')
    expect(toast.success).toHaveBeenCalledWith('Tenant updated successfully')
  })
})

describe('UpdateTenantSettingsForm', () => {
  it('should prefill the governance settings of the tenant', () => {
    const tenant = buildTenant({
      governanceSettings: {
        reminderSchedule: [{ day: 5 }],
        escalationDays: [{ day: 20 }],
        rollCallFrequency: 'monthly',
        passwordUpdateCadenceDays: 90,
      },
    })
    render(<UpdateTenantSettingsForm tenant={tenant} />)
    expect(screen.getByRole('textbox', { name: /Password Update Cadence/ })).toHaveValue('90')
  })

  it('should fall back to the default cadence and save the settings', async () => {
    render(<UpdateTenantSettingsForm tenant={buildTenant({ id: 10 })} />)
    expect(screen.getByRole('textbox', { name: /Password Update Cadence/ })).toHaveValue('180')
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard/tenants'))
    const call = callTo('/api/tenants/10/governance')
    expect(call?.[1]?.method).toBe('PATCH')
    expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({
      rollCallFrequency: 'quarterly',
      passwordUpdateCadenceDays: 180,
    })
    expect(toast.success).toHaveBeenCalledWith('Governance settings updated successfully')
  })

  it('should discard the edits on reset', async () => {
    render(<UpdateTenantSettingsForm tenant={buildTenant({ id: 10 })} />)
    const cadence = screen.getByRole('textbox', { name: /Password Update Cadence/ })
    await userEvent.clear(cadence)
    await userEvent.type(cadence, '45')
    await userEvent.click(screen.getByRole('button', { name: 'Reset to Current' }))
    expect(toast.info).toHaveBeenCalledWith('Changes discarded')
    expect(cadence).toHaveValue('180')
  })
})
