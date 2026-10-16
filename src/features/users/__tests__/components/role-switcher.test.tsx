import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { RoleSwitcher } from '../../components/role-switcher'
import { UserRolesEnum } from '../../schemas'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const fetchMock = vi.fn<typeof fetch>()
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const roles = [UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager]

beforeEach(() => {
  refresh.mockReset()
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  // cmdk (the role list) relies on browser APIs jsdom does not implement.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  Element.prototype.scrollIntoView = vi.fn()
  localStorage.setItem('dashboardCache', '{}')
  localStorage.setItem('userPermissions', '[]')
})
afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

const openList = async () => {
  const user = userEvent.setup()
  await user.click(screen.getByRole('combobox', { name: 'Switch role' }))
  return user
}

describe('RoleSwitcher', () => {
  it('should render nothing for users with a single role', () => {
    const { container } = render(
      <RoleSwitcher userRoles={[UserRolesEnum.UnitAdmin]} activeRole={UserRolesEnum.UnitAdmin} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('should show the active role on the trigger', () => {
    render(<RoleSwitcher userRoles={roles} activeRole={UserRolesEnum.UnitAdmin} />)
    expect(screen.getByRole('combobox', { name: 'Switch role' })).toHaveTextContent('Unit Admin')
  })

  it('should list every role the user holds with its description', async () => {
    render(<RoleSwitcher userRoles={roles} activeRole={UserRolesEnum.UnitAdmin} />)
    await openList()
    expect(screen.getByText('Manage your unit')).toBeInTheDocument()
    expect(screen.getByText('Manage social accounts')).toBeInTheDocument()
  })

  it('should not call the API when the active role is picked again', async () => {
    render(<RoleSwitcher userRoles={roles} activeRole={UserRolesEnum.UnitAdmin} />)
    const user = await openList()
    await user.click(screen.getByText('Manage your unit'))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should switch role, clear cached permissions and refresh the page', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true }))
    render(<RoleSwitcher userRoles={roles} activeRole={UserRolesEnum.UnitAdmin} />)
    const user = await openList()
    await user.click(screen.getByText('Manage social accounts'))

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Switched to Social Media Manager'),
    )
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://app.styreiq.test/api/users/switch-role')
    expect(JSON.parse(String(init?.body))).toEqual({ role: 'social_media_manager' })
    expect(localStorage.getItem('dashboardCache')).toBeNull()
    expect(localStorage.getItem('userPermissions')).toBeNull()
    expect(refresh).toHaveBeenCalled()
  })

  it('should show the server error and not refresh when switching fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { error: 'You do not have this role' }))
    render(<RoleSwitcher userRoles={roles} activeRole={UserRolesEnum.UnitAdmin} />)
    const user = await openList()
    await user.click(screen.getByText('Manage social accounts'))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('You do not have this role'))
    expect(refresh).not.toHaveBeenCalled()
    expect(localStorage.getItem('dashboardCache')).toBe('{}')
  })
})
