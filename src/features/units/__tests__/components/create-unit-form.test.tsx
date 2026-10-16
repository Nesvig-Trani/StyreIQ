import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { CreateUnitForm } from '@/features/units/forms/create-unit'
import { UserRolesEnum } from '@/shared/constants/user-roles'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  usePathname: () => '/dashboard/units/create',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const fetchMock = vi.fn<typeof fetch>()
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const universidad = buildOrganization({ id: 100, name: 'Universidad Andina' })
const jimena = buildUser({ id: 9, name: 'Jimena Salazar' })

const renderForm = () =>
  render(
    <CreateUnitForm
      userRole={UserRolesEnum.CentralAdmin}
      users={[jimena]}
      organizations={[universidad]}
      defaultParentOrg="100"
      selectedTenantId={10}
    />,
  )

beforeEach(() => {
  fetchMock.mockReset()
  push.mockReset()
  vi.mocked(toast.success).mockReset()
  vi.mocked(toast.error).mockReset()
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockImplementation(async (url) =>
    String(url).includes('filtered-users')
      ? jsonResponse(200, { docs: [jimena] })
      : jsonResponse(201, { id: 200 }),
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('CreateUnitForm', () => {
  it('should load the candidate admins of the default parent organization', async () => {
    renderForm()
    await vi.waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        'https://app.styreiq.test/api/organization/filtered-users?parentOrgId=100&parentOrgName=Universidad+Andina',
        expect.objectContaining({ method: 'GET' }),
      ),
    )
  })

  it('should show validation errors when required fields are empty', async () => {
    renderForm()
    await userEvent.click(screen.getByRole('button', { name: /submit|create|save/i }))
    expect(await screen.findByText('Name is required')).toBeVisible()
    expect(fetchMock).not.toHaveBeenCalledWith(
      'https://app.styreiq.test/api/organization',
      expect.anything(),
    )
  })

  it('should create the unit for the selected tenant and go back to the list', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText(/Name/), 'Dirección de Comunicaciones')
    await userEvent.type(
      screen.getByLabelText(/Website URL/),
      'https://comunicaciones.universidad-andina.edu',
    )
    await userEvent.click(screen.getByRole('button', { name: /submit|create|save/i }))

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard/units'))
    const createCall = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith('/api/organization'),
    )
    expect(createCall?.[1]?.method).toBe('POST')
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      name: 'Dirección de Comunicaciones',
      parentOrg: 100,
      tenant: 10,
      admin: null,
      status: 'active',
    })
    expect(toast.success).toHaveBeenCalledWith('Unit created successfully')
  })

  it('should surface the API failure to the user', async () => {
    fetchMock.mockImplementation(async (url) =>
      String(url).includes('filtered-users')
        ? jsonResponse(200, { docs: [] })
        : jsonResponse(500, { error: 'boom' }),
    )
    renderForm()
    await userEvent.type(screen.getByLabelText(/Name/), 'Dirección de Comunicaciones')
    await userEvent.type(
      screen.getByLabelText(/Website URL/),
      'https://comunicaciones.universidad-andina.edu',
    )
    await userEvent.click(screen.getByRole('button', { name: /submit|create|save/i }))
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(vi.mocked(toast.error).mock.calls[0][0]).toContain('Failed to create unit')
    expect(push).not.toHaveBeenCalled()
  })
})
