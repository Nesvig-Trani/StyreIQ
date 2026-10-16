import '@/shared/components/__tests__/dom-polyfills'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuditLogsTable } from '../../components/audit-logs-table'
import { buildAuditLog, buildSocialMediaAccount, buildTenant } from '../fixtures'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  search: '',
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push, replace: nav.replace, refresh: nav.refresh }),
  usePathname: () => '/dashboard/audit-log',
  useSearchParams: () => new URLSearchParams(nav.search),
}))

beforeEach(() => {
  vi.clearAllMocks()
  nav.search = ''
})

const pagination = { pageSize: 10, pageIndex: 0, total: 3, pageCount: 1 }
const admin = buildUser({ id: 7, name: 'Valentina Restrepo' })
const tenant = buildTenant()

const logs = [
  buildAuditLog({
    id: 1,
    action: 'create',
    entity: 'organization',
    user: admin,
    document: {
      relationTo: 'organization',
      value: buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' }),
    },
    organizations: [buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' })],
    prev: {},
    current: { name: 'Dirección de Comunicaciones', status: 'active' },
    tenant,
  }),
  buildAuditLog({
    id: 2,
    action: 'email_failed',
    entity: 'compliance_tasks',
    user: admin,
    metadata: { recipient: 'camila.ortega@universidad-andina.edu', success: false },
  }),
  buildAuditLog({
    id: 3,
    action: 'update',
    entity: 'social-medias',
    user: buildUser({ id: 9, name: 'Mateo Giraldo' }),
    document: { relationTo: 'social-medias', value: buildSocialMediaAccount({ id: 8 }) },
  }),
]

const renderTable = (props: Partial<Parameters<typeof AuditLogsTable>[0]> = {}) =>
  render(<AuditLogsTable data={logs} users={[admin]} pagination={pagination} {...props} />)

describe('AuditLogsTable', () => {
  it('should show who did what, to which entity and record', () => {
    renderTable()
    const rows = screen.getAllByRole('row')
    const created = within(rows[1])
    expect(created.getByText('Valentina Restrepo')).toBeInTheDocument()
    expect(created.getByText('Create')).toBeInTheDocument()
    expect(created.getByText('organization')).toBeInTheDocument()
    expect(created.getByText('Dirección de Comunicaciones')).toBeInTheDocument()
    expect(created.getByText('Sep 15, 2026')).toBeInTheDocument()
  })

  it('should humanize entity names and label unknown affected records', () => {
    renderTable()
    const row = screen.getAllByRole('row')[2]
    expect(within(row).getByText('compliance tasks')).toBeInTheDocument()
    expect(within(row).getByText('Email Failed')).toBeInTheDocument()
    expect(within(row).getByText('No affected record recorded')).toBeInTheDocument()
  })

  it('should not show the tenant column for a single tenant', () => {
    renderTable()
    expect(screen.queryByRole('columnheader', { name: /Tenant/ })).not.toBeInTheDocument()
  })

  it('should show the tenant of each entry when viewing all tenants', () => {
    renderTable({ isViewingAllTenants: true, tenants: [tenant] })
    expect(screen.getByRole('columnheader', { name: /Tenant/ })).toBeInTheDocument()
    expect(screen.getByText('Universidad Andina')).toBeInTheDocument()
    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
  })

  it('should open the details dialog with user, action and the changes made', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(
      screen.getByRole('button', {
        name: 'View audit log details for Create on organization by Valentina Restrepo, Dirección de Comunicaciones',
      }),
    )

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Audit Log Details')).toBeInTheDocument()
    expect(
      within(dialog).getByText('valentina.restrepo@universidad-andina.edu'),
    ).toBeInTheDocument()
    expect(within(dialog).getByText('Changes (Created)')).toBeInTheDocument()
  })

  it('should show the metadata of the entry in the details dialog', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(
      screen.getByRole('button', {
        name: 'View audit log details for Email Failed on compliance tasks by Valentina Restrepo',
      }),
    )

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Metadata')).toBeInTheDocument()
    expect(within(dialog).getByText('camila.ortega@universidad-andina.edu')).toBeInTheDocument()
    expect(within(dialog).queryByText(/Changes \(/)).not.toBeInTheDocument()
  })

  it('should offer a filter per kind of affected record built from the visible logs', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByRole('button', { name: 'Filter by Unit Affected Record' }))

    expect(await screen.findByText('All Unit Affected Record')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Dirección de Comunicaciones' })).toBeInTheDocument()
  })

  it('should add the chosen record to the URL and reset to the first page', async () => {
    nav.search = `pagination=${encodeURIComponent(JSON.stringify({ pageIndex: 3, pageSize: 10 }))}&socialMediaDocumentId=2&userDocumentId=1`
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByRole('button', { name: 'Filter by Unit Affected Record' }))
    await user.click(await screen.findByRole('option', { name: 'Dirección de Comunicaciones' }))

    const pushed = new URL(nav.push.mock.calls[0][0], 'https://app.styreiq.test')
    expect(pushed.searchParams.get('organizationDocumentId')).toBe('100')
    expect(pushed.searchParams.has('userDocumentId')).toBe(false)
    expect(pushed.searchParams.has('socialMediaDocumentId')).toBe(false)
    expect(JSON.parse(pushed.searchParams.get('pagination') ?? '{}').pageIndex).toBe(0)
  })

  it('should clear a record filter when choosing "All"', async () => {
    nav.search = 'organizationDocumentId=100'
    const user = userEvent.setup()
    renderTable()

    await user.click(
      screen.getByRole('button', {
        name: 'Filter by Unit Affected Record, 1 option selected: Dirección de Comunicaciones',
      }),
    )
    await user.click(await screen.findByText('All Unit Affected Record'))

    const pushed = new URL(nav.push.mock.calls[0][0], 'https://app.styreiq.test')
    expect(pushed.searchParams.has('organizationDocumentId')).toBe(false)
  })
})
