import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import { UpdateUserForm } from '../../forms/update-user'
import { UserRolesEnum } from '../../schemas'

const push = vi.fn()
const searchParams = vi.hoisted(() => ({ current: new URLSearchParams() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams.current,
}))
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn() }),
}))

const fetchMock = vi.fn<typeof fetch>()
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const comunicaciones = buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' })
const artes = buildOrganization({ id: 101, name: 'Facultad de Artes', depth: 0, path: '/101' })
const mateo = buildUser({
  id: 12,
  name: 'Mateo Giraldo',
  email: 'mateo.giraldo@universidad-andina.edu',
  roles: ['social_media_manager'],
  status: 'active',
  organizations: [100],
})

const renderForm = () =>
  render(
    <UpdateUserForm
      id="12"
      organizations={[comunicaciones, artes]}
      data={mateo}
      authUserRole={UserRolesEnum.CentralAdmin}
    />,
  )

beforeEach(() => {
  push.mockReset()
  searchParams.current = new URLSearchParams()
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
  vi.mocked(toast.warning).mockClear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('UpdateUserForm', () => {
  it('should prefill the form with the current user data', () => {
    renderForm()
    expect(screen.getByLabelText(/Email/)).toHaveValue('mateo.giraldo@universidad-andina.edu')
    expect(screen.getByLabelText(/Name/)).toHaveValue('Mateo Giraldo')
    expect(screen.getByRole('button', { name: 'Update User' })).toBeInTheDocument()
  })

  it('should send the changes and return to the users list', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 12 }))
    renderForm()
    const user = userEvent.setup()
    const name = screen.getByLabelText(/Name/)
    await user.clear(name)
    await user.type(name, 'Mateo Giraldo Ruiz')
    await user.click(screen.getByRole('button', { name: 'Update User' }))

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard/users'))
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://app.styreiq.test/api/users/')
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(String(init?.body))).toMatchObject({
      id: 12,
      name: 'Mateo Giraldo Ruiz',
      roles: ['social_media_manager'],
      organizations: ['100'],
      status: 'active',
    })
    expect(toast.success).toHaveBeenCalledWith('User updated successfully')
  })

  it('should return to the page given in the returnTo parameter', async () => {
    searchParams.current = new URLSearchParams({ returnTo: '/dashboard/units/100' })
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 12 }))
    renderForm()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Update User' }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard/units/100'))
  })

  it('should warn about the organizations that would be left without a unit admin', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        error: 'conflict',
        organizations: [{ id: 100, name: 'Dirección de Comunicaciones' }],
      }),
    )
    renderForm()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Update User' }))

    await waitFor(() => expect(toast.warning).toHaveBeenCalled())
    expect(vi.mocked(toast.warning).mock.calls[0][0]).toContain('Dirección de Comunicaciones')
    expect(push).not.toHaveBeenCalled()
  })

  it('should show the server message for other failures', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(403, { error: 'Cannot change your own roles or units' }),
    )
    renderForm()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Update User' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Cannot change your own roles or units'),
    )
    expect(push).not.toHaveBeenCalled()
  })
})
