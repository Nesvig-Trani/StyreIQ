import '@/shared/components/__tests__/dom-polyfills'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { ReviewRequestTable } from '../../components/review-request-table'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const routerMock = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  usePathname: () => '/dashboard/review-requests',
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

const pagination = { pageSize: 10, pageIndex: 0, total: 2, pageCount: 1 }

const applicants = [
  buildUser({
    id: 41,
    name: 'Camila Ortega',
    email: 'camila.ortega@universidad-andina.edu',
    roles: ['unit_admin', 'social_media_manager'],
    active_role: 'unit_admin',
    status: 'pending_activation',
    organizations: [buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' })],
  }),
  buildUser({
    id: 42,
    name: 'Mateo Giraldo',
    email: 'mateo.giraldo@universidad-andina.edu',
    roles: ['social_media_manager'],
    status: 'pending_activation',
    organizations: [],
  }),
]

const renderTable = () => render(<ReviewRequestTable data={applicants} pagination={pagination} />)

describe('ReviewRequestTable', () => {
  it('should list each applicant with roles, status and units', () => {
    renderTable()
    const rows = screen.getAllByRole('row')

    const camila = within(rows[1])
    expect(camila.getByText('Camila Ortega')).toBeInTheDocument()
    expect(camila.getByText('camila.ortega@universidad-andina.edu')).toBeInTheDocument()
    expect(camila.getByText(/Unit Admin/)).toHaveTextContent('Unit Admin ★')
    expect(camila.getByText('Social Media Manager')).toBeInTheDocument()
    expect(camila.getByText('Pending Activation')).toBeInTheDocument()
    expect(camila.getByText('Dirección de Comunicaciones')).toBeInTheDocument()

    expect(within(rows[2]).getByText('-')).toBeInTheDocument()
  })

  it('should link the edit action to the user update page', () => {
    renderTable()
    const links = screen.getAllByRole('link', { name: 'Edit user' })
    expect(links[0]).toHaveAttribute('href', '/dashboard/users/update/41')
  })

  it('should approve the applicant, toast and refresh', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true }))
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getAllByRole('button', { name: 'Approve user request' })[0])

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('User approved successfully'))
    expect(routerMock.refresh).toHaveBeenCalled()
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/api/users/status')
    expect(JSON.parse(String(init?.body))).toEqual({ id: 41, approved: true })
  })

  it('should toast an error and not refresh when approval fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getAllByRole('button', { name: 'Approve user request' })[0])

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('An error occurred please try again later'),
    )
    expect(routerMock.refresh).not.toHaveBeenCalled()
  })
})

describe('RejectApplicationButton (reject dialog)', () => {
  const openDialog = async () => {
    const user = userEvent.setup()
    renderTable()
    await user.click(screen.getAllByRole('button', { name: 'Reject user request' })[1])
    await screen.findByRole('dialog')
    return user
  }

  it('should not allow confirming without a reason', async () => {
    await openDialog()
    expect(screen.getByRole('button', { name: 'Confirm Rejection' })).toBeDisabled()
  })

  it('should send the reason, toast, close the dialog and refresh', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true }))
    const user = await openDialog()

    await user.type(
      screen.getByLabelText('Rejection Reason'),
      'La cuenta no pertenece a la Universidad Andina',
    )
    await user.click(screen.getByRole('button', { name: 'Confirm Rejection' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('User rejected successfully'))
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      id: 42,
      approved: false,
      reason: 'La cuenta no pertenece a la Universidad Andina',
    })
    expect(routerMock.refresh).toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('should toast an error and keep the dialog open when rejection fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    const user = await openDialog()

    await user.type(screen.getByLabelText('Rejection Reason'), 'Datos incompletos')
    await user.click(screen.getByRole('button', { name: 'Confirm Rejection' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('An error occurred please try again later'),
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should discard the typed reason when cancelling', async () => {
    const user = await openDialog()
    await user.type(screen.getByLabelText('Rejection Reason'), 'Datos incompletos')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await user.click(screen.getAllByRole('button', { name: 'Reject user request' })[1])
    expect(await screen.findByLabelText('Rejection Reason')).toHaveValue('')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
