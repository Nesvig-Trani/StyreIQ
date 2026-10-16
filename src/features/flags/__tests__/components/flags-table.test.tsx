import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import FlagsTable from '../../components/flags-table'
import { buildFlag, buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import type { Flag } from '@/types/payload-types'
import { jsonResponse } from '../fixtures'

const navigation = vi.hoisted(() => ({
  refresh: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  search: '',
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: navigation.refresh,
    push: navigation.push,
    replace: navigation.replace,
  }),
  usePathname: () => '/dashboard/flags',
  useSearchParams: () => new URLSearchParams(navigation.search),
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const fetchMock = vi.fn<typeof fetch>()

const pagination = { pageSize: 10, pageIndex: 0, total: 2, pageCount: 1 }

const pendingFlag = buildFlag({
  id: 55,
  flagType: 'missing_2fa',
  status: 'pending',
  source: 'automated',
  organizations: [buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' })],
  affectedEntity: {
    relationTo: 'users',
    value: buildUser({ id: 42, name: 'Camilo Ortiz' }),
  },
  detectionDate: '2026-10-10T12:00:00.000Z',
  lastActivity: '2026-08-01T12:00:00.000Z',
})

const resolvedFlag = buildFlag({
  id: 56,
  flagType: 'unknown_legacy_type',
  status: 'resolved',
  source: 'manual',
  tenant: { id: 10, name: 'Universidad Andina' } as Flag['tenant'],
})

const renderTable = (props: Partial<Parameters<typeof FlagsTable>[0]> = {}) =>
  render(
    <FlagsTable
      data={[pendingFlag, resolvedFlag]}
      user={buildUser({ roles: ['central_admin'] })}
      pagination={pagination}
      organizations={[buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' })]}
      userComplianceTasks={new Map()}
      {...props}
    />,
  )

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  navigation.refresh.mockClear()
  navigation.search = ''
  vi.mocked(toast.error).mockClear()
  vi.mocked(toast.success).mockClear()
})
afterEach(() => vi.unstubAllGlobals())

describe('FlagsTable', () => {
  it('should render a row per flag with readable labels', () => {
    renderTable()

    expect(screen.getByText('Missing 2FA')).toBeInTheDocument()
    expect(screen.getByText('Camilo Ortiz')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Resolved')).toBeInTheDocument()
    expect(screen.getByText('Auto generated')).toBeInTheDocument()
    expect(screen.getByText('Manually entered')).toBeInTheDocument()
    expect(screen.getByText('Dirección de Comunicaciones')).toBeInTheDocument()
  })

  it('should show a placeholder for flags with an unknown type or no organizations', () => {
    renderTable()

    expect(screen.getByText('No risk flag type recorded')).toBeInTheDocument()
    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
  })

  it('should not show the tenant column when viewing a single tenant', () => {
    renderTable()

    expect(screen.queryByRole('columnheader', { name: /Tenant/ })).not.toBeInTheDocument()
  })

  it('should show the tenant column when viewing all tenants', () => {
    renderTable({ isViewingAllTenants: true })

    expect(screen.getByRole('columnheader', { name: /Tenant/ })).toBeInTheDocument()
    expect(screen.getByText('Universidad Andina')).toBeInTheDocument()
  })

  it('should give each action an accessible name that identifies the flag', () => {
    renderTable()

    expect(
      screen.getByRole('button', {
        name: 'View risk flag details for flag #55, Missing 2FA, affected Camilo Ortiz',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'View flag history for flag #55, Missing 2FA, affected Camilo Ortiz',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'View flag comments for flag #55, Missing 2FA, affected Camilo Ortiz',
      }),
    ).toBeInTheDocument()
  })

  it('should include the tenant name in the accessible name of the actions', () => {
    renderTable()

    expect(
      screen.getByRole('button', {
        name: /View flag history for flag #56, tenant Universidad Andina/,
      }),
    ).toBeInTheDocument()
  })

  it('should not let non super admins resolve flags', () => {
    renderTable({ user: buildUser({ roles: ['central_admin'] }) })

    expect(screen.queryByRole('button', { name: /Resolve risk flag/ })).not.toBeInTheDocument()
  })

  it('should only offer to resolve pending flags to super admins', () => {
    renderTable({ user: buildUser({ roles: ['super_admin'], tenant: null }) })

    expect(screen.getAllByRole('button', { name: /Resolve risk flag/ })).toHaveLength(1)
    expect(
      screen.getByRole('button', { name: /Resolve risk flag for flag #55/ }),
    ).toBeInTheDocument()
  })

  it('should resolve the flag, notify and refresh the page', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 55 }))
    renderTable({ user: buildUser({ roles: ['super_admin'], tenant: null }) })

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Resolve risk flag for flag #55/ }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Risk flag resolved'))
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://app.styreiq.test/api/flags/resolved/55')
    expect(init?.method).toBe('PUT')
    expect(navigation.refresh).toHaveBeenCalled()
  })

  it('should show an error and not refresh when resolving fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    renderTable({ user: buildUser({ roles: ['super_admin'], tenant: null }) })

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Resolve risk flag for flag #55/ }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('An error occurred while marking as resolved'),
    )
    expect(navigation.refresh).not.toHaveBeenCalled()
  })

  it('should render an empty table without rows', () => {
    renderTable({ data: [], pagination: { ...pagination, total: 0 } })

    expect(within(screen.getByRole('table')).queryByText('Missing 2FA')).not.toBeInTheDocument()
  })
})
