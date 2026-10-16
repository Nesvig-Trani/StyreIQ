import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TenantProvider } from '@/features/tenants/contexts/tenant-context'
import { TenantSelector } from '@/features/tenants/components/tenant-selector'
import TenantsTable from '@/features/tenants/components/tenants-table'
import { buildUser } from '@/shared/__tests__/fixtures'
import { buildTenant } from '../tenant-fixtures'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh, replace: vi.fn() }),
  usePathname: () => '/dashboard/tenants',
  useSearchParams: () => new URLSearchParams(),
}))

const fetchMock = vi.fn<typeof fetch>()

const andina = buildTenant({ id: 10, name: 'Universidad Andina' })
const sanMartin = buildTenant({ id: 11, name: 'Colegio San Martín', domain: 'sanmartin.edu.co' })
const superAdmin = buildUser({ roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({ roles: ['central_admin'], tenant: 10 })

beforeEach(() => {
  fetchMock.mockReset()
  refresh.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  // cmdk and Radix popovers rely on browser APIs that jsdom does not implement
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})
afterEach(() => vi.unstubAllGlobals())

const renderSelector = (
  user: ReturnType<typeof buildUser>,
  tenants = [andina, sanMartin],
  selected: typeof andina | null = null,
) =>
  render(
    <TenantProvider user={user} initialSelectedTenant={selected} initialAvailableTenants={tenants}>
      <TenantSelector />
    </TenantProvider>,
  )

describe('TenantSelector', () => {
  it('should not render for roles that cannot switch tenants', () => {
    const { container } = renderSelector(centralAdmin, [andina], andina)
    expect(container).toBeEmptyDOMElement()
  })

  it('should not render when there are no tenants to choose from', () => {
    const { container } = renderSelector(superAdmin, [])
    expect(container).toBeEmptyDOMElement()
  })

  it('should show "All Tenants" when no tenant is selected', () => {
    renderSelector(superAdmin)
    expect(screen.getByRole('combobox', { name: 'Viewing Tenant' })).toHaveTextContent(
      'All Tenants',
    )
  })

  it('should show the name of the selected tenant', () => {
    renderSelector(superAdmin, [andina, sanMartin], sanMartin)
    expect(screen.getByRole('combobox')).toHaveTextContent('Colegio San Martín')
  })

  it('should switch to the chosen tenant and refresh', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
    renderSelector(superAdmin)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByText('sanmartin.edu.co'))
    await vi.waitFor(() =>
      expect(screen.getByRole('combobox')).toHaveTextContent('Colegio San Martín'),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      'https://app.styreiq.test/api/tenants/select-tenant',
      expect.objectContaining({ body: JSON.stringify({ tenantId: 11 }) }),
    )
    expect(refresh).toHaveBeenCalled()
  })

  it('should return to viewing all tenants', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
    renderSelector(superAdmin, [andina, sanMartin], andina)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByText('View aggregate data from all tenants'))
    await vi.waitFor(() => expect(screen.getByRole('combobox')).toHaveTextContent('All Tenants'))
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify({ tenantId: null }) }),
    )
  })
})

describe('TenantsTable', () => {
  const pagination = { pageSize: 10, pageIndex: 1, total: 2, pageCount: 1 }

  it('should offer edit and governance links to super admins', () => {
    render(<TenantsTable user={superAdmin} data={[andina, sanMartin]} pagination={pagination} />)
    expect(screen.getByRole('table', { name: 'Tenants' })).toBeVisible()
    expect(screen.getByText('universidad-andina.edu')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Edit tenant — Universidad Andina' })).toHaveAttribute(
      'href',
      '/dashboard/tenants/update/10',
    )
    expect(
      screen.getByRole('link', { name: 'Governance settings — Colegio San Martín' }),
    ).toHaveAttribute('href', '/dashboard/tenants/update-governance-settings/11')
  })

  it('should only offer governance settings to central admins', () => {
    render(<TenantsTable user={centralAdmin} data={[andina]} pagination={pagination} />)
    expect(screen.queryByRole('link', { name: /Edit tenant/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Governance settings/ })).toBeVisible()
  })

  it('should hide the actions column from other roles', () => {
    const unitAdmin = buildUser({ roles: ['unit_admin'], tenant: 10, organizations: [100] })
    render(<TenantsTable user={unitAdmin} data={[andina]} pagination={pagination} />)
    expect(screen.queryByText('Actions')).not.toBeInTheDocument()
  })

  it('should label tenants without a name by their id', () => {
    render(
      <TenantsTable
        user={superAdmin}
        data={[buildTenant({ id: 12, name: '  ' })]}
        pagination={pagination}
      />,
    )
    expect(screen.getByRole('link', { name: 'Edit tenant — Tenant #12' })).toBeVisible()
  })
})
