import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { useUnitHierarchy } from '@/features/units/hooks/useUnitHierarchy'
import { createUnitTree } from '@/features/units/utils/createUnitTree'
import type { UnitWithDepth } from '@/features/units/schemas'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const push = vi.fn()
const refresh = vi.fn()
let currentSearch = ''

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
  usePathname: () => '/dashboard/units',
  useSearchParams: () => new URLSearchParams(currentSearch),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const universidad = buildOrganization({
  id: 1,
  name: 'Universidad Andina',
  type: 'higher_education_institution',
  path: '1',
  status: 'active',
})
const facultad = buildOrganization({
  id: 2,
  name: 'Facultad de Artes',
  type: 'school_faculty',
  path: '1/2',
  depth: 1,
  status: 'pending_review',
})
const biblioteca = buildOrganization({
  id: 3,
  name: 'Biblioteca Central',
  type: 'office',
  path: '3',
  status: 'inactive',
})
const rafael = buildUser({ id: 7, name: 'Rafael Mejía' })

const toUnit = (
  org: ReturnType<typeof buildOrganization>,
  parentOrg: ReturnType<typeof buildOrganization>,
  admin: ReturnType<typeof buildUser> | null = null,
): UnitWithDepth => ({
  ...org,
  parentOrg,
  admin,
  backupAdmins: undefined,
  children: undefined,
})

const originalData: UnitWithDepth[] = [
  toUnit(universidad, { ...universidad, id: 0 }, rafael),
  toUnit(facultad, universidad),
  toUnit(biblioteca, { ...biblioteca, id: 0 }, rafael),
]

const setup = (extra: { detailHeadingRef?: React.RefObject<HTMLHeadingElement | null> } = {}) =>
  renderHook(() =>
    useUnitHierarchy({
      originalData,
      organizations: createUnitTree(originalData),
      users: [rafael],
      pagination: { pageSize: 10, pageIndex: 1, total: 2, pageCount: 1 },
      ...extra,
    }),
  )

beforeEach(() => {
  push.mockReset()
  refresh.mockReset()
  currentSearch = ''
  vi.mocked(toast.success).mockReset()
  vi.mocked(toast.error).mockReset()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useUnitHierarchy filters and navigation', () => {
  it('should push the status filter into the url and reset it for "all"', () => {
    const { result } = setup()
    act(() => result.current.handleStatusChange('inactive'))
    expect(result.current.statusFilter).toBe('inactive')
    expect(push).toHaveBeenLastCalledWith('/dashboard/units?status=inactive')
    act(() => result.current.handleStatusChange('all'))
    expect(push).toHaveBeenLastCalledWith('/dashboard/units?')
  })

  it('should push the type and tenant filters into the url', () => {
    const { result } = setup()
    act(() => result.current.handleTypeChange('office'))
    expect(push).toHaveBeenLastCalledWith('/dashboard/units?type=office')
    act(() => result.current.handleTenantChange('10'))
    expect(result.current.tenantFilter).toBe('10')
    expect(push).toHaveBeenLastCalledWith('/dashboard/units?tenant=10')
    act(() => result.current.handleTenantChange('all'))
    expect(push).toHaveBeenLastCalledWith('/dashboard/units?')
    act(() => result.current.handleTypeChange('all'))
    expect(push).toHaveBeenLastCalledWith('/dashboard/units?')
  })

  it('should keep the current search params when updating a filter', () => {
    currentSearch = 'search=musica'
    const { result } = setup()
    act(() => result.current.handleStatusChange('active'))
    expect(push).toHaveBeenLastCalledWith('/dashboard/units?search=musica&status=active')
  })

  it('should debounce the search term into the url', async () => {
    const user = userEvent.setup()
    const { result } = setup()
    push.mockReset()
    const view = render(
      <input aria-label="Search units" onChange={result.current.handleSearchChange} />,
    )
    await user.type(view.getByLabelText('Search units'), 'Biblioteca')
    expect(push).not.toHaveBeenCalled()
    await vi.waitFor(
      () => expect(push).toHaveBeenLastCalledWith('/dashboard/units?search=Biblioteca'),
      { timeout: 2000 },
    )
    expect(result.current.searchTerm).toBe('Biblioteca')
  })

  it('should navigate to the requested page with a one-based index', () => {
    const { result } = setup()
    act(() => result.current.handlePageChange(2))
    const [url] = push.mock.calls[0]
    expect(decodeURIComponent(String(url))).toBe('/dashboard/units?pagination={"pageIndex":3}')
  })
})

describe('useUnitHierarchy tree rendering', () => {
  it('should render root units with their type and status', () => {
    const { result } = setup()
    render(<>{result.current.renderFilteredResults()}</>)
    expect(
      screen.getByRole('button', { name: /^Universidad Andina, Higher Education/ }),
    ).toBeVisible()
    expect(screen.getByText('Biblioteca Central')).toBeVisible()
    expect(screen.getByText('Inactive')).toBeVisible()
    expect(screen.queryByText('Manager needed')).not.toBeInTheDocument()
  })

  it('should flag units without admin as needing a manager in the accessible label', () => {
    const unassigned: UnitWithDepth[] = [toUnit(universidad, { ...universidad, id: 0 }, null)]
    const { result } = renderHook(() =>
      useUnitHierarchy({
        originalData: unassigned,
        organizations: createUnitTree(unassigned),
        users: [],
        pagination: { pageSize: 10, pageIndex: 1, total: 1, pageCount: 1 },
      }),
    )
    render(<>{result.current.renderFilteredResults()}</>)
    expect(screen.getByText('Manager needed')).toBeVisible()
    expect(
      screen.getByRole('button', {
        name: 'Universidad Andina, Higher Education Institution, Active, Manager Not assigned yet',
      }),
    ).toBeVisible()
  })

  it('should expand and collapse children from the chevron button', async () => {
    const user = userEvent.setup()
    const { result } = setup()
    const view = render(<>{result.current.renderFilteredResults()}</>)
    expect(screen.queryByText('Facultad de Artes')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Expand Universidad Andina' }))
    view.rerender(<>{result.current.renderFilteredResults()}</>)
    expect(screen.getByText('Facultad de Artes')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Collapse Universidad Andina' }))
    view.rerender(<>{result.current.renderFilteredResults()}</>)
    expect(screen.queryByText('Facultad de Artes')).not.toBeInTheDocument()
  })

  it('should select a unit on click and on Enter or Space', async () => {
    const user = userEvent.setup()
    const { result } = setup()
    const view = render(<>{result.current.renderFilteredResults()}</>)

    await user.click(screen.getByRole('button', { name: /^Biblioteca Central/ }))
    expect(result.current.selectedOrg?.id).toBe(3)
    expect(result.current.lastSelectedRowTriggerRef.current).not.toBeNull()

    view.rerender(<>{result.current.renderFilteredResults()}</>)
    const universidadRow = screen.getByRole('button', { name: /^Universidad Andina,/ })
    universidadRow.focus()
    await user.keyboard('{Enter}')
    expect(result.current.selectedOrg?.id).toBe(1)

    await user.click(screen.getByRole('button', { name: /^Biblioteca Central/ }))
    screen.getByRole('button', { name: /^Biblioteca Central/ }).focus()
    await user.keyboard(' ')
    expect(result.current.selectedOrg?.id).toBe(3)
  })

  it('should focus the detail heading when the same unit is selected again', async () => {
    const user = userEvent.setup()
    const heading = document.createElement('h2')
    heading.tabIndex = -1
    document.body.append(heading)
    const { result } = setup({ detailHeadingRef: { current: heading } })
    const view = render(<>{result.current.renderFilteredResults()}</>)

    await user.click(screen.getByRole('button', { name: /^Biblioteca Central/ }))
    view.rerender(<>{result.current.renderFilteredResults()}</>)
    await user.click(screen.getByRole('button', { name: /^Biblioteca Central/ }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(heading).toHaveFocus()
    heading.remove()
  })
})

describe('useUnitHierarchy disabling', () => {
  const selectBiblioteca = async () => {
    const user = userEvent.setup()
    const hook = setup()
    render(<>{hook.result.current.renderFilteredResults()}</>)
    await user.click(screen.getByRole('button', { name: /^Biblioteca Central/ }))
    return hook
  }

  it('should do nothing when no unit is selected', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { result } = setup()
    await act(() => result.current.handleConfirmDisable())
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should disable the selected unit, notify and refresh', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const { result } = await selectBiblioteca()
    act(() => result.current.setIsDisableModalOpen(true))
    await act(() => result.current.handleConfirmDisable())
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'https://app.styreiq.test/api/organization/disable/3',
    )
    expect(toast.success).toHaveBeenCalledWith('Organization disabled successfully')
    expect(refresh).toHaveBeenCalled()
    expect(result.current.isDisableModalOpen).toBe(false)
    expect(result.current.selectedOrg).toBeNull()
  })

  it('should report an error when disabling fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })))
    const { result } = await selectBiblioteca()
    await act(() => result.current.handleConfirmDisable())
    expect(toast.error).toHaveBeenCalledWith('Failed to disable unit')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('should show the reason given by the server and keep the unit selected (GIQ-106)', async () => {
    const reason = 'Cannot disable this unit while it has active sub-units: Sala de Lectura.'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: reason }), { status: 409 })),
    )
    const { result } = await selectBiblioteca()
    act(() => result.current.setIsDisableModalOpen(true))
    await act(() => result.current.handleConfirmDisable())
    expect(toast.error).toHaveBeenCalledWith(reason)
    expect(refresh).not.toHaveBeenCalled()
    expect(result.current.isDisableModalOpen).toBe(true)
    expect(result.current.selectedOrg).not.toBeNull()
  })
})
