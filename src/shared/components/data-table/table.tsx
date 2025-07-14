'use client'

import type { ColumnDef, PaginationState } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'

import { DataTablePagination } from './pagination'
import { DataTableBody } from './table-body'
import { DataTableToolbar } from './toolbar'
import type { DataTableFilter, DataTableGlobalFilter, DataTableSorting } from './types'
import type { FilterValue, GlobalFilter } from './use-data-table'
import { useDataTable } from './use-data-table'
import { Table, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'

type DataTablePaginationProps =
  | {
      pagination: PaginationState
      pageSizeOptions?: number[]
      pageCount: number
    }
  | { pagination?: never; pageSizeOptions?: never; pageCount?: never }

type DataTableGlobalFilteringProps =
  | {
      globalFiltersDefs: DataTableGlobalFilter[]
      globalFilter: GlobalFilter
    }
  | { globalFiltersDefs?: never; globalFilter?: never }

type DataTableColumnFilteringProps<TData> =
  | {
      columnFiltersDefs: DataTableFilter[]
      columnFilters: Partial<Record<keyof TData, FilterValue>>
    }
  | { columnFiltersDefs?: never; columnFilters?: never }

type DataTableProps<TData> = {
  // any needs to be used here to avoid a typing issue from tanstack/table
  // https://github.com/TanStack/table/issues/4382#issuecomment-1420412062
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[]
  data?: TData[]
  error?: string | null
  loading?: boolean | null

  // sorting
  sorting?: DataTableSorting<TData>[]
} & DataTablePaginationProps &
  DataTableGlobalFilteringProps &
  DataTableColumnFilteringProps<TData>

export const DataTable = <TData,>(props: DataTableProps<TData>): React.ReactNode => {
  const {
    columns,
    data = [],
    error,
    loading,
    pagination,
    pageSizeOptions,
    pageCount,
    sorting,
    globalFiltersDefs,
    globalFilter,
    columnFiltersDefs,
    columnFilters,
  } = props

  const table = useDataTable({
    columns,
    data,
    pagination,
    pageCount,
    sorting,
    globalFiltersDefs,
    globalFilter,
    columnFiltersDefs,
    columnFilters,
  })

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        globalFiltersDefs={globalFiltersDefs}
        columnFiltersDefs={columnFiltersDefs}
      />

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <DataTableBody table={table} error={error} loading={loading} />
          </Table>
        </div>
      </div>

      {pagination != null && (
        <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
      )}
    </div>
  )
}
