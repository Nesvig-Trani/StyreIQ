import '@/shared/components/__tests__/dom-polyfills'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import RoleRequestsTable from '../../components/RoleRequestsTable'
import { UserRolesEnum } from '@/features/users'
import { buildRoleRequest, buildTenant } from '../fixtures'
import { buildUser } from '@/shared/__tests__/fixtures'

const routerMock = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  usePathname: () => '/dashboard/role-request',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const fetchMock = vi.fn<typeof fetch>()
const pagination = { pageSize: 10, pageIndex: 0, total: 3, pageCount: 1 }

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

const requests = [
  buildRoleRequest({ id: 1 }),
  buildRoleRequest({
    id: 2,
    status: 'approved',
    requestedRole: 'central_admin',
    user: buildUser({
      id: 32,
      name: 'Mateo Giraldo',
      email: 'mateo.giraldo@universidad-andina.edu',
    }),
  }),
]

describe('RoleRequestsTable', () => {
  it('should list requesters, role labels and statuses', () => {
    render(<RoleRequestsTable data={requests} pagination={pagination} userRole={null} />)

    expect(screen.getByText('Camila Ortega')).toBeInTheDocument()
    expect(screen.getByText('camila.ortega@universidad-andina.edu')).toBeInTheDocument()
    expect(screen.getByText('Unit Admin')).toBeInTheDocument()
    expect(screen.getByText('Central Admin')).toBeInTheDocument()
    expect(screen.getByText('pending')).toBeInTheDocument()
    expect(screen.getByText('approved')).toBeInTheDocument()
  })

  it('should hide the actions column from users who cannot review requests', () => {
    render(
      <RoleRequestsTable
        data={requests}
        pagination={pagination}
        userRole={UserRolesEnum.UnitAdmin}
      />,
    )
    expect(screen.queryByRole('button', { name: /Approve role request/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Actions')).not.toBeInTheDocument()
  })

  it('should show approve and reject only for pending requests when the user can review', () => {
    render(
      <RoleRequestsTable
        data={requests}
        pagination={pagination}
        userRole={UserRolesEnum.CentralAdmin}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Approve role request — Camila Ortega, Unit Admin' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reject role request — Camila Ortega, Unit Admin' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Processed')).toBeInTheDocument()
  })

  it('should post the approval, toast and refresh the page', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true }))
    const user = userEvent.setup()
    render(
      <RoleRequestsTable
        data={requests}
        pagination={pagination}
        userRole={UserRolesEnum.SuperAdmin}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Approve role request/ }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Role request approved'))
    expect(routerMock.refresh).toHaveBeenCalled()
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/api/role-requests/1/approve')
    expect(JSON.parse(String(init?.body))).toEqual({ approved: true })
  })

  it('should toast the server message when rejecting fails', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, { message: 'This request has already been processed' }),
    )
    const user = userEvent.setup()
    render(
      <RoleRequestsTable
        data={requests}
        pagination={pagination}
        userRole={UserRolesEnum.CentralAdmin}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Reject role request/ }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('This request has already been processed'),
    )
    expect(routerMock.refresh).not.toHaveBeenCalled()
  })

  it('should show a tenant column with tenant badges when viewing all tenants', () => {
    render(
      <RoleRequestsTable
        data={[
          buildRoleRequest({ id: 1, tenant: buildTenant() }),
          buildRoleRequest({ id: 2, tenant: 10 }),
        ]}
        pagination={pagination}
        userRole={UserRolesEnum.SuperAdmin}
        tenants={[buildTenant(), buildTenant({ id: 11, name: 'Instituto Pacífico' })]}
        isViewingAllTenants
      />,
    )
    expect(screen.getByText('Universidad Andina')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
