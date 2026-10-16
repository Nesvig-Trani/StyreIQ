import '../../__tests__/dom-polyfills'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import UnitHierarchy from '../index'
import type { Tree, UnitWithDepth } from '@/features/units'
import { buildOrganization, buildUser } from '../../../__tests__/fixtures'
import type { Tenant } from '@/types/payload-types'
import { buildTenant, buildUnitWithDepth } from '../../__tests__/component-fixtures'

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/dashboard/units',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const university = buildOrganization({
  id: 1,
  name: 'Universidad Andina',
  type: 'higher_education_institution',
})
const communications = buildOrganization({
  id: 2,
  name: 'Dirección de Comunicaciones',
  type: 'office',
  parentOrg: 1,
  description: 'Gestiona los canales oficiales',
})

const manager = buildUser({
  id: 7,
  name: 'Valentina Restrepo',
  email: 'valentina.restrepo@universidad-andina.edu',
})

const originalData: UnitWithDepth[] = [
  buildUnitWithDepth(university, university, manager),
  buildUnitWithDepth(communications, university),
]

const tree: Tree[] = [
  {
    id: 1,
    parent: 0,
    name: 'Universidad Andina',
    depth: 0,
    status: 'active',
    type: 'higher_education_institution',
    children: [
      {
        id: 2,
        parent: 1,
        name: 'Dirección de Comunicaciones',
        depth: 1,
        status: 'active',
        type: 'office',
        children: [],
      },
    ],
  },
]

const pagination = { pageSize: 10, pageIndex: 1, total: 25, pageCount: 3 }

const tenants: Tenant[] = [buildTenant()]

function renderHierarchy(props: Partial<React.ComponentProps<typeof UnitHierarchy>> = {}) {
  return render(
    <UnitHierarchy
      organizations={tree}
      originalData={originalData}
      users={[manager]}
      user={buildUser({ roles: ['central_admin'] })}
      pagination={pagination}
      {...props}
    />,
  )
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.unstubAllGlobals())

describe('UnitHierarchy', () => {
  it('should prompt to select a unit when nothing is selected', () => {
    renderHierarchy()
    expect(screen.getByText('Select a unit to view details')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Universidad Andina/ })).toBeInTheDocument()
  })

  it('should expand a parent unit to reveal its children', async () => {
    const user = userEvent.setup()
    renderHierarchy()
    expect(
      screen.queryByRole('button', { name: /Dirección de Comunicaciones/ }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Expand Universidad Andina' }))
    expect(screen.getByRole('button', { name: /Dirección de Comunicaciones/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Collapse Universidad Andina' }))
    expect(
      screen.queryByRole('button', { name: /Dirección de Comunicaciones/ }),
    ).not.toBeInTheDocument()
  })

  it('should flag units without a manager in their accessible name', async () => {
    const user = userEvent.setup()
    renderHierarchy()
    await user.click(screen.getByRole('button', { name: 'Expand Universidad Andina' }))
    expect(screen.getByText('Manager needed')).toBeInTheDocument()
  })

  it('should show the detail panel and announce the selection', async () => {
    const user = userEvent.setup()
    renderHierarchy()

    await user.click(screen.getByRole('button', { name: /^Universidad Andina/ }))

    const panel = await screen.findByRole('region', { name: 'Universidad Andina' })
    expect(within(panel).getByRole('heading', { name: 'Universidad Andina' })).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('Selected unit: Universidad Andina')
    expect(within(panel).getByText('Valentina Restrepo')).toBeInTheDocument()
  })

  it('should select a unit from the keyboard', async () => {
    const user = userEvent.setup()
    renderHierarchy()
    screen.getByRole('button', { name: /^Universidad Andina/ }).focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('region', { name: 'Universidad Andina' })).toBeInTheDocument()
  })

  it('should return focus to the selected row when Escape is pressed in the panel', async () => {
    const user = userEvent.setup()
    renderHierarchy()
    const row = screen.getByRole('button', { name: /^Universidad Andina/ })
    await user.click(row)
    await screen.findByRole('region', { name: 'Universidad Andina' })

    await user.keyboard('{Escape}')
    expect(row).toHaveFocus()
  })

  it('should toggle between detail and edit mode', async () => {
    const user = userEvent.setup()
    renderHierarchy()
    await user.click(screen.getByRole('button', { name: /^Universidad Andina/ }))
    await screen.findByRole('region', { name: 'Universidad Andina' })

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue('Universidad Andina')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('should hide edit and disable actions from social media managers', async () => {
    const user = userEvent.setup()
    renderHierarchy({
      user: buildUser({ roles: ['social_media_manager'], organizations: [university] }),
    })
    await user.click(screen.getByRole('button', { name: /^Universidad Andina/ }))
    await screen.findByRole('region', { name: 'Universidad Andina' })
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Disable' })).not.toBeInTheDocument()
  })

  it('should disable a unit after confirmation and refresh the page', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    renderHierarchy()
    await user.click(screen.getByRole('button', { name: /^Universidad Andina/ }))
    await screen.findByRole('region', { name: 'Universidad Andina' })

    await user.click(screen.getByRole('button', { name: 'Disable' }))
    await user.click(await screen.findByRole('button', { name: 'Disable Anyway' }))

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Organization disabled successfully'),
    )
    expect(fetchMock.mock.calls[0][0]).toContain('/api/organization/disable/1')
    expect(router.refresh).toHaveBeenCalled()
    expect(screen.getByText('Select a unit to view details')).toBeInTheDocument()
  })

  it('should report an error when disabling a unit fails', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    renderHierarchy()
    await user.click(screen.getByRole('button', { name: /^Universidad Andina/ }))
    await screen.findByRole('region', { name: 'Universidad Andina' })

    await user.click(screen.getByRole('button', { name: 'Disable' }))
    await user.click(await screen.findByRole('button', { name: 'Disable Anyway' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to disable unit'))
  })

  it('should push the pagination state to the URL', async () => {
    const user = userEvent.setup()
    renderHierarchy()
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(decodeURIComponent(String(router.push.mock.calls.at(-1)?.[0]))).toContain(
      '"pageIndex":3',
    )

    await user.click(screen.getByRole('button', { name: 'Go to previous page' }))
    expect(decodeURIComponent(String(router.push.mock.calls.at(-1)?.[0]))).toContain(
      '"pageIndex":1',
    )
  })

  it('should disable the previous button on the first page and next on the last', () => {
    const { unmount } = renderHierarchy({ pagination: { ...pagination, pageIndex: 0 } })
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled()
    unmount()
    renderHierarchy({ pagination: { ...pagination, pageIndex: 2 } })
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled()
  })

  it('should debounce the name search into the URL', async () => {
    const user = userEvent.setup()
    renderHierarchy()
    await user.type(screen.getByRole('searchbox', { name: 'Search units by name' }), 'Comunic')
    await waitFor(
      () =>
        expect(router.push.mock.calls.some(([url]) => String(url).includes('search=Comunic'))).toBe(
          true,
        ),
      { timeout: 2000 },
    )
  })

  it('should push the status and type filters to the URL', async () => {
    const user = userEvent.setup()
    renderHierarchy()

    await user.click(screen.getByRole('combobox', { name: 'Filter by status' }))
    await user.click(await screen.findByRole('option', { name: 'Inactive' }))
    expect(router.push.mock.calls.some(([url]) => String(url).includes('status=inactive'))).toBe(
      true,
    )

    await user.click(screen.getByRole('combobox', { name: 'Filter by type' }))
    await user.click(await screen.findByRole('option', { name: /Office/ }))
    expect(router.push.mock.calls.some(([url]) => String(url).includes('type=office'))).toBe(true)
  })

  it('should offer a tenant filter only when viewing all tenants', async () => {
    const user = userEvent.setup()
    const { unmount } = renderHierarchy()
    expect(screen.queryByRole('combobox', { name: 'Filter by tenant' })).not.toBeInTheDocument()
    unmount()

    renderHierarchy({ tenants, isViewingAllTenants: true })
    await user.click(screen.getByRole('combobox', { name: 'Filter by tenant' }))
    await user.click(await screen.findByRole('option', { name: 'Universidad Andina' }))
    expect(router.push.mock.calls.some(([url]) => String(url).includes('tenant=10'))).toBe(true)

    await user.click(screen.getByRole('combobox', { name: 'Filter by tenant' }))
    await user.click(await screen.findByRole('option', { name: 'All Tenants' }))
    expect(router.push.mock.calls.some(([url]) => !String(url).includes('tenant='))).toBe(true)
  })
})
