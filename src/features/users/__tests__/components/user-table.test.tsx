import '@/shared/components/__tests__/dom-polyfills'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { Tenant, User } from '@/types/payload-types'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import { UserTable } from '../../components/user-table'

const routerMock = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  usePathname: () => '/dashboard/users',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const fetchMock = vi.fn<typeof fetch>()
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const andina: Tenant = {
  id: 10,
  name: 'Universidad Andina',
  status: 'active',
  domain: 'universidad-andina.edu',
  adminContactName: 'Andrés Londoño',
  adminContactEmail: 'andres.londono@universidad-andina.edu',
  createdAt: '2026-09-01T14:30:00.000Z',
  updatedAt: '2026-09-01T14:30:00.000Z',
}

const comunicaciones = buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' })
const camila = buildUser({
  id: 1,
  name: 'Camila Ortega',
  email: 'camila.ortega@styreiq.com',
  roles: ['super_admin'],
  tenant: null,
})
const andres = buildUser({
  id: 2,
  name: 'Andrés Londoño',
  email: 'andres.londono@universidad-andina.edu',
  roles: ['central_admin'],
  tenant: andina,
  organizations: [],
})
const sofia = buildUser({
  id: 3,
  name: 'Sofía Mejía',
  email: 'sofia.mejia@universidad-andina.edu',
  roles: ['unit_admin'],
  status: 'pending_activation',
  organizations: [comunicaciones],
})
const mateo = buildUser({
  id: 4,
  name: 'Mateo Giraldo',
  email: 'mateo.giraldo@universidad-andina.edu',
  roles: ['social_media_manager'],
  organizations: [comunicaciones],
})

const renderTable = ({
  viewer,
  data = [sofia, mateo],
  isViewingAllTenants = false,
}: {
  viewer: User | null
  data?: User[]
  isViewingAllTenants?: boolean
}) =>
  render(
    <UserTable
      data={data}
      pagination={{ pageSize: 10, pageIndex: 0, total: data.length, pageCount: 1 }}
      user={viewer}
      tenants={[andina]}
      isViewingAllTenants={isViewingAllTenants}
      userComplianceTasks={new Map()}
    />,
  )

const rowFor = (name: string) => {
  const cell = screen.getByText(name)
  const row = cell.closest('tr')
  if (!row) throw new Error(`row for ${name} not found`)
  return within(row)
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(jsonResponse(200, {}))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('UserTable', () => {
  it('should list each user with their roles, status and units', async () => {
    renderTable({ viewer: andres })
    const sofiaRow = rowFor('Sofía Mejía')
    expect(sofiaRow.getByText('sofia.mejia@universidad-andina.edu')).toBeInTheDocument()
    expect(sofiaRow.getByText('Unit Admin')).toBeInTheDocument()
    expect(sofiaRow.getByText('Pending Activation')).toBeInTheDocument()
    expect(sofiaRow.getByText('Dirección de Comunicaciones')).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  })

  it('should label the table by scope', async () => {
    renderTable({ viewer: andres })
    expect(screen.getByRole('table', { name: 'Users' })).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  })

  it('should request roll call status for the listed users', async () => {
    renderTable({ viewer: andres })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://app.styreiq.test/api/compliance_tasks/roll-call-status')
    expect(JSON.parse(String(init?.body))).toEqual({ userIds: [3, 4] })
  })

  it('should show StyreIQ instead of units for super admins and a dash for users without units', async () => {
    renderTable({ viewer: camila, data: [camila, andres] })
    expect(rowFor('Camila Ortega').getByText('StyreIQ')).toBeInTheDocument()
    expect(rowFor('Andrés Londoño').getByText('-')).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  })

  it('should show the tenant column when viewing all tenants', async () => {
    renderTable({ viewer: camila, data: [camila, andres], isViewingAllTenants: true })
    expect(screen.getByRole('table', { name: 'Users across tenants' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Tenant' })).toBeInTheDocument()
    expect(rowFor('Andrés Londoño').getByText('Universidad Andina')).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  })

  it('should let central admins edit users and manage their access', async () => {
    renderTable({ viewer: andres })
    const row = rowFor('Mateo Giraldo')
    expect(row.getByRole('link', { name: /Edit user/ })).toHaveAttribute(
      'href',
      '/dashboard/users/update/4',
    )
    expect(row.getByRole('link', { name: /Manage user access/ })).toHaveAttribute(
      'href',
      '/dashboard/users/access/4',
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  })

  it('should not let super admins manage unit access', async () => {
    renderTable({ viewer: camila, data: [mateo] })
    expect(rowFor('Mateo Giraldo').queryByRole('link', { name: /Manage user access/ })).toBeNull()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  })

  it('should prevent unit admins from editing central admins', async () => {
    renderTable({ viewer: sofia, data: [andres, mateo] })
    expect(rowFor('Andrés Londoño').queryByRole('link', { name: /Edit user/ })).toBeNull()
    expect(rowFor('Mateo Giraldo').getByRole('link', { name: /Edit user/ })).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  })

  it('should limit social media managers to editing their own record', async () => {
    renderTable({ viewer: mateo, data: [mateo, sofia] })
    expect(rowFor('Mateo Giraldo').getByRole('link', { name: /Edit user/ })).toBeInTheDocument()
    expect(rowFor('Sofía Mejía').queryByRole('link', { name: /Edit user/ })).toBeNull()
    expect(rowFor('Mateo Giraldo').queryByRole('link', { name: /Manage user access/ })).toBeNull()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  })

  it('should show the roll call action only to admins who can manage compliance', async () => {
    renderTable({ viewer: andres, data: [mateo] })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(
      rowFor('Mateo Giraldo').getByRole('button', { name: 'Generate Roll Call for Mateo Giraldo' }),
    ).toBeInTheDocument()
  })

  it('should hide the roll call action when one is already pending', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { '4': { hasPending: true, lastCompletedDays: null } }),
    )
    renderTable({ viewer: andres, data: [mateo] })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await waitFor(() =>
      expect(
        rowFor('Mateo Giraldo').queryByRole('button', { name: /Generate Roll Call/ }),
      ).toBeNull(),
    )
  })

  it('should open and close the user details dialog from the view button', async () => {
    renderTable({ viewer: andres, data: [mateo] })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 50)) // let the roll call status settle
    // userEvent's pointer sequence remounts the row cell mid-click, so a plain click event is used.
    fireEvent.click(rowFor('Mateo Giraldo').getByRole('button', { name: /View user details/ }))
    expect(await screen.findByText('Basic Information')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
