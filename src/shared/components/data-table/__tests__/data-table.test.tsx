import '../../__tests__/dom-polyfills'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../table'
import { DataTableColumnHeader } from '../column-header'

type Unit = {
  id: number
  name: string
  type: string
  admin: string
}

const units: Unit[] = [
  { id: 1, name: 'Dirección de Comunicaciones', type: 'office', admin: 'Valentina Restrepo' },
  { id: 2, name: 'Facultad de Ingeniería', type: 'faculty', admin: 'Rafael Mejía' },
  { id: 3, name: 'Biblioteca Central', type: 'office', admin: 'Camila Ospina' },
]

const router = vi.hoisted(() => ({ push: vi.fn() }))
const location = vi.hoisted(() => ({ pathname: '/dashboard/units', search: '' }))

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => location.pathname,
  useSearchParams: () => new URLSearchParams(location.search),
}))

const columns: ColumnDef<Unit>[] = [
  {
    accessorKey: 'name',
    enableSorting: true,
    enableHiding: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Unit name" />,
  },
  {
    accessorKey: 'admin',
    enableHiding: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Admin" />,
  },
]

const lastPush = (): string => String(router.push.mock.calls.at(-1)?.[0])

beforeEach(() => {
  router.push.mockClear()
  location.pathname = '/dashboard/units'
  location.search = ''
})

describe('DataTable rendering', () => {
  it('should render headers and rows with an accessible table name', () => {
    render(<DataTable columns={columns} data={units} tableAccessibleName="Units directory" />)

    const table = screen.getByRole('table', { name: 'Units directory' })
    expect(within(table).getByText('Dirección de Comunicaciones')).toBeInTheDocument()
    expect(within(table).getByText('Rafael Mejía')).toBeInTheDocument()
    expect(within(table).getAllByRole('row')).toHaveLength(4)
  })

  it('should show an empty state when there are no rows', () => {
    render(<DataTable columns={columns} data={[]} />)
    expect(screen.getByText('No results found.')).toBeInTheDocument()
  })

  it('should show the error message instead of rows', () => {
    render(<DataTable columns={columns} data={units} error="No pudimos cargar las unidades" />)
    expect(screen.getByText('No pudimos cargar las unidades')).toBeInTheDocument()
    expect(screen.queryByText('Biblioteca Central')).not.toBeInTheDocument()
  })

  it('should render skeleton rows while loading', () => {
    render(<DataTable columns={columns} data={units} loading />)
    expect(screen.queryByText('Biblioteca Central')).not.toBeInTheDocument()
    expect(screen.getAllByRole('row').length).toBe(11)
  })
})

describe('DataTable pagination', () => {
  const renderPaginated = (pageIndex: number, pageCount = 5) =>
    render(
      <DataTable
        columns={columns}
        data={units}
        pagination={{ pageIndex, pageSize: 10 }}
        pageCount={pageCount}
      />,
    )

  it('should summarise the current page and disable backwards navigation on the first page', () => {
    renderPaginated(0)
    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /previous page/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next page, page 2 of 5/ })).toBeEnabled()
  })

  it('should push the next page to the URL', async () => {
    const user = userEvent.setup()
    renderPaginated(1)

    await user.click(screen.getByRole('button', { name: /next page, page 3 of 5/ }))
    await waitFor(() => expect(router.push).toHaveBeenCalled())
    expect(decodeURIComponent(lastPush())).toContain('pageIndex')
    expect(lastPush()).toMatch(/^\/dashboard\/units\?/)
  })

  it('should push the previous, first and last pages', async () => {
    const user = userEvent.setup()
    renderPaginated(2)

    await user.click(screen.getByRole('button', { name: /previous page, page 2 of 5/ }))
    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1))
    await user.click(screen.getByRole('button', { name: /first page/ }))
    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(2))
    await user.click(screen.getByRole('button', { name: /last page/ }))
    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(3))
  })

  it('should disable forward navigation on the last page', () => {
    renderPaginated(4)
    expect(screen.getByRole('button', { name: /next page/ })).toBeDisabled()
  })

  it('should show a no-pages message when there are no pages', () => {
    renderPaginated(0, 0)
    expect(screen.getByText('No pages')).toBeInTheDocument()
  })

  it('should change the page size from the selector', async () => {
    const user = userEvent.setup()
    renderPaginated(0)

    await user.click(screen.getByRole('combobox', { name: /Rows per page/ }))
    await user.click(await screen.findByRole('option', { name: '20' }))
    await waitFor(() => expect(router.push).toHaveBeenCalled())
    expect(decodeURIComponent(lastPush())).toContain('pageSize')
  })
})

describe('DataTable sorting and column visibility', () => {
  it('should push the chosen sort order to the URL', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={columns}
        data={units}
        pagination={{ pageIndex: 0, pageSize: 10 }}
        pageCount={1}
        sorting={[]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Unit name' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Desc' }))

    await waitFor(() => expect(router.push).toHaveBeenCalled())
    expect(decodeURIComponent(lastPush())).toContain('desc')
  })

  it('should clear sorting when the active order is chosen again', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={columns}
        data={units}
        pagination={{ pageIndex: 0, pageSize: 10 }}
        pageCount={1}
        sorting={[{ column: 'name', order: 'asc' }]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Unit name' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Asc' }))

    await waitFor(() => expect(router.push).toHaveBeenCalled())
    expect(decodeURIComponent(lastPush())).not.toContain('asc')
  })

  it('should render non-sortable headers as plain text', () => {
    const plainColumns: ColumnDef<Unit>[] = [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Unit name" />,
      },
    ]
    render(<DataTable columns={plainColumns} data={units} />)
    expect(screen.queryByRole('button', { name: 'Unit name' })).not.toBeInTheDocument()
    expect(screen.getByText('Unit name')).toBeInTheDocument()
  })

  it('should let the user hide a column from the view menu', async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={units} />)

    await user.click(screen.getByRole('button', { name: 'View' }))
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'admin' }))

    await waitFor(() => expect(screen.queryByText('Rafael Mejía')).not.toBeInTheDocument())
  })
})

describe('DataTable filters', () => {
  it('should debounce the search and push it to the URL, resetting to page one', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={columns}
        data={units}
        pagination={{ pageIndex: 3, pageSize: 10 }}
        pageCount={5}
        globalFiltersDefs={[{ type: 'search', id: 'q', label: 'Search units' }]}
        globalFilter={{}}
      />,
    )

    await user.type(screen.getByRole('textbox', { name: 'Search units' }), 'Biblio')

    await waitFor(() => expect(router.push).toHaveBeenCalled(), { timeout: 2000 })
    const url = decodeURIComponent(lastPush())
    expect(url).toContain('q="Biblio"')
    expect(url).toContain('"pageIndex":0')
  })

  it('should show the reset button when the URL has filters and navigate to the bare path', async () => {
    const user = userEvent.setup()
    location.search = 'q=Biblio'
    render(
      <DataTable
        columns={columns}
        data={units}
        globalFiltersDefs={[{ type: 'search', id: 'q' }]}
        globalFilter={{ q: 'Biblio' }}
      />,
    )

    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('Biblio')
    await user.click(screen.getByRole('button', { name: /Reset/ }))
    expect(router.push).toHaveBeenCalledWith('/dashboard/units')
  })

  it('should select options in a multi select global filter and clear them', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={columns}
        data={units}
        globalFiltersDefs={[
          {
            type: 'select',
            id: 'type',
            title: 'Type',
            options: [
              { label: 'Office', value: 'office' },
              { label: 'Faculty', value: 'faculty' },
            ],
          },
        ]}
        globalFilter={{ type: ['office'] }}
      />,
    )

    const trigger = screen.getByRole('button', {
      name: 'Filter by Type, 1 option selected: Office',
    })
    await user.click(trigger)
    await user.click(await screen.findByRole('option', { name: 'Faculty' }))
    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1))
    expect(decodeURIComponent(lastPush())).toContain('type')
    expect(decodeURIComponent(lastPush())).toContain('faculty')

    await user.click(screen.getByRole('option', { name: 'Clear filters' }))
    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(2))
    expect(decodeURIComponent(lastPush())).not.toContain('type')
  })

  it('should describe three or more selections by count only', () => {
    render(
      <DataTable
        columns={columns}
        data={units}
        globalFiltersDefs={[
          {
            type: 'select',
            id: 'type',
            title: 'Type',
            options: [
              { label: 'Office', value: 'office' },
              { label: 'Faculty', value: 'faculty' },
              { label: 'Institute', value: 'institute' },
            ],
          },
        ]}
        globalFilter={{ type: ['office', 'faculty', 'institute'] }}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Filter by Type, 3 options selected' }),
    ).toBeInTheDocument()
    expect(screen.getByText('3 selected')).toBeInTheDocument()
  })

  it('should apply a single-value select filter on a column', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={[...columns, { accessorKey: 'type', header: 'Type', enableColumnFilter: true }]}
        data={units}
        pagination={{ pageIndex: 0, pageSize: 10 }}
        pageCount={1}
        columnFiltersDefs={[
          {
            type: 'select',
            id: 'type',
            title: 'Unit type',
            allowMultiple: false,
            options: [
              { label: 'Office', value: 'office' },
              { label: 'Faculty', value: 'faculty' },
            ],
          },
        ]}
        columnFilters={{}}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Filter by Unit type' }))
    await user.click(await screen.findByRole('option', { name: 'Faculty' }))
    await waitFor(() => expect(router.push).toHaveBeenCalled())
    expect(decodeURIComponent(lastPush())).toContain('type="faculty"')
  })

  it('should render date and date range filters', () => {
    render(
      <DataTable
        columns={[...columns, { accessorKey: 'id', header: 'Created', enableColumnFilter: true }]}
        data={units}
        globalFiltersDefs={[
          { type: 'date-range', id: 'period', title: 'Period', disabledDays: 'future' },
        ]}
        globalFilter={{}}
        columnFiltersDefs={[
          { type: 'date', id: 'id', disabledDays: 'past' },
          { type: 'date-range', id: 'id', title: 'Created between', disabledDays: 'past' },
        ]}
        columnFilters={{}}
      />,
    )
    expect(
      screen.getAllByRole('button', { name: /Pick a date|Created between|Period/ }).length,
    ).toBeGreaterThan(0)
  })
})
