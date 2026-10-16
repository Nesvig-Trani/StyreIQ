import '@/shared/components/__tests__/dom-polyfills'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { buildOrganization } from '@/shared/__tests__/fixtures'
import { CreateUserForm } from '../../forms/create-user'
import { USER_ALREADY_EXISTS } from '../../constants/Errors'
import { UserRolesEnum } from '../../schemas'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}))

const fetchMock = vi.fn<typeof fetch>()
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const organizations = [
  buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' }),
  buildOrganization({ id: 101, name: 'Facultad de Artes', path: '/101' }),
]

const renderForm = (authUserRole: UserRolesEnum = UserRolesEnum.UnitAdmin) =>
  render(
    <CreateUserForm
      authUserRole={authUserRole}
      initialOrganizations={organizations}
      selectedTenantId={10}
    />,
  )

const fillAndSubmit = async () => {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/Email/), 'laura.pineda@universidad-andina.edu')
  await user.type(screen.getByLabelText(/^Name/), 'Laura Pineda')

  await user.click(screen.getByRole('button', { name: /Roles/ }))
  await user.click(await screen.findByText('Social Media Manager'))
  await user.keyboard('{Escape}')

  await user.click(await screen.findByRole('combobox', { name: /Organization/ }))
  await user.click(await screen.findByRole('checkbox', { name: 'Dirección de Comunicaciones' }))
  await user.keyboard('{Escape}')

  await user.click(screen.getByRole('button', { name: 'Submit' }))
}

beforeEach(() => {
  push.mockReset()
  vi.mocked(toast).mockClear()
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('CreateUserForm', () => {
  it('should ask for the new user data and hide the status for unit admins', () => {
    renderForm()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
    expect(screen.queryByText('Status')).not.toBeInTheDocument()
  })

  it('should only offer roles the signed in admin may assign', async () => {
    renderForm(UserRolesEnum.UnitAdmin)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Roles/ }))
    const options = await screen.findByRole('listbox')
    expect(within(options).getByText('Unit Admin')).toBeInTheDocument()
    expect(within(options).getByText('Social Media Manager')).toBeInTheDocument()
    expect(within(options).queryByText('Central Admin')).not.toBeInTheDocument()
    expect(within(options).queryByText('Super Admin')).not.toBeInTheDocument()
  })

  it('should create the user in the selected tenant and open the access page', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 55, active_role: 'social_media_manager' }))
    renderForm()
    await fillAndSubmit()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard/users/access/55'))
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://app.styreiq.test/api/users')
    expect(JSON.parse(String(init?.body))).toMatchObject({
      name: 'Laura Pineda',
      email: 'laura.pineda@universidad-andina.edu',
      roles: ['social_media_manager'],
      organizations: ['100'],
      tenant: 10,
    })
    expect(toast.success).toHaveBeenCalledWith('User created successfully')
  })

  it('should send the creator to the existing user when the email is already registered', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { message: USER_ALREADY_EXISTS, details: 77 }))
    renderForm()
    await fillAndSubmit()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard/users/update/77'))
    expect(toast).toHaveBeenCalledWith('User already exists, update the user instead')
  })

  it('should show an error toast when the API fails for another reason', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { message: 'Error creating user' }))
    renderForm()
    await fillAndSubmit()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'An error occurred while creating the user, please try again',
      ),
    )
    expect(push).not.toHaveBeenCalled()
  })

  it('should not call the API while required fields are missing', async () => {
    renderForm()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(screen.getAllByRole('button').length).toBeGreaterThan(0))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should return to the social media accounts page when cancelled', async () => {
    renderForm()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }))
    expect(push).toHaveBeenCalledWith('/dashboard/social-media-accounts/')
  })
})
