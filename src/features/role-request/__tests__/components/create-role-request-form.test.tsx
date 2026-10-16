import '@/shared/components/__tests__/dom-polyfills'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import CreateRoleRequestForm from '../../forms/create-role-request-form'
import { UserRolesEnum } from '@/features/users'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const routerMock = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  usePathname: () => '/dashboard/role-request/create',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const fetchMock = vi.fn<typeof fetch>()
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

const organizations = [
  buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' }),
  buildOrganization({ id: 101, name: 'Facultad de Ingeniería' }),
]
const currentUser = buildUser({ roles: [UserRolesEnum.SocialMediaManager] })

describe('CreateRoleRequestForm', () => {
  it('should offer the justification and unit fields with a cancel action', () => {
    render(<CreateRoleRequestForm currentUser={currentUser} organizations={organizations} />)
    expect(screen.getByLabelText(/Justification/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('should go back to the role requests list when cancelling', async () => {
    const user = userEvent.setup()
    render(<CreateRoleRequestForm currentUser={currentUser} organizations={organizations} />)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(routerMock.push).toHaveBeenCalledWith('/dashboard/role-request')
  })

  it('should not submit when the unit and justification are missing', async () => {
    const user = userEvent.setup()
    render(<CreateRoleRequestForm currentUser={currentUser} organizations={organizations} />)

    await user.click(screen.getByRole('button', { name: /submit|save|create|request/i }))

    expect(await screen.findByText('Organization is required')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should require a justification of at least 20 characters', async () => {
    const user = userEvent.setup()
    render(<CreateRoleRequestForm currentUser={currentUser} organizations={organizations} />)

    await user.click(screen.getByLabelText(/Justification/))
    await user.paste('Lo necesito')
    await user.click(screen.getByRole('button', { name: /submit|save|create|request/i }))

    expect(
      await screen.findByText('Justification must be at least 20 characters'),
    ).toBeInTheDocument()
  })

  it('should submit the request, toast and return to the list', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { success: true }))
    const user = userEvent.setup()
    render(<CreateRoleRequestForm currentUser={currentUser} organizations={organizations} />)

    await user.click(screen.getByRole('combobox', { name: /Unit/ }))
    await user.click(await screen.findByText('Dirección de Comunicaciones'))
    await user.click(screen.getByLabelText(/Justification/))
    await user.paste('Necesito administrar la Dirección de Comunicaciones durante el semestre.')
    await user.click(screen.getByRole('button', { name: /submit|save|create|request/i }))

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Role request submitted successfully'),
    )
    expect(routerMock.push).toHaveBeenCalledWith('/dashboard/role-request')
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body).toMatchObject({ requestedRole: UserRolesEnum.CentralAdmin, organization: '100' })
  })

  it('should toast the error when the request is rejected by the server', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { message: 'You already have this role' }))
    const user = userEvent.setup()
    render(<CreateRoleRequestForm currentUser={currentUser} organizations={organizations} />)

    await user.click(screen.getByRole('combobox', { name: /Unit/ }))
    await user.click(await screen.findByText('Facultad de Ingeniería'))
    await user.click(screen.getByLabelText(/Justification/))
    await user.paste('Necesito administrar la Facultad de Ingeniería durante el semestre.')
    await user.click(screen.getByRole('button', { name: /submit|save|create|request/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('You already have this role'))
    expect(routerMock.push).not.toHaveBeenCalled()
  })
})
