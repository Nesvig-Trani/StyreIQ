'use client'

import type { Table } from '@tanstack/react-table'
import { cn } from '@/shared/utils/cn'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50]

type DataTablePaginationProps<TData> = {
  table: Table<TData>
  pageSizeOptions?: number[]
}

export const DataTablePagination = <TData,>(
  props: DataTablePaginationProps<TData>,
): React.ReactNode => {
  const { table, pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS } = props

  const tableState = table.getState()
  const { pageSize, pageIndex } = tableState.pagination
  const isSomeRowsSelected = table.getIsSomeRowsSelected()

  const pageCount = table.getPageCount()
  const currentPage = pageCount === 0 ? 0 : pageIndex + 1
  const safePageCount = Math.max(0, pageCount)

  const canPrevious = table.getCanPreviousPage()
  const canNext = table.getCanNextPage()

  const rowsPerPageLabel = `Rows per page, ${pageSize} rows selected`

  const handlePageSizeChange = (value: string): void => {
    table.setPageSize(parseInt(value, 10))
  }

  const buildPageNavLabel = (action: string, targetPage: number, isActive: boolean): string => {
    if (safePageCount === 0) return `${action}, no pages`
    if (isActive) return `Go to ${action}, page ${targetPage} of ${safePageCount}`
    return `Go to ${action} (already on page ${currentPage} of ${safePageCount})`
  }

  const firstPageLabel = buildPageNavLabel('first page', 1, pageIndex > 0)
  const previousPageLabel = buildPageNavLabel('previous page', pageIndex, canPrevious)
  const nextPageLabel = buildPageNavLabel('next page', pageIndex + 2, canNext)
  const lastPageLabel = buildPageNavLabel('last page', safePageCount, pageIndex < safePageCount - 1)

  return (
    <div
      className={cn(
        'flex flex-col items-end px-2 space-y-2 md:flex-row md:space-y-0 md:items-center',
        isSomeRowsSelected ? 'md:justify-between' : 'md:justify-end',
      )}
    >
      {isSomeRowsSelected && (
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
      )}

      <div className="flex flex-col items-end space-y-2 md:flex-row md:space-x-6 md:space-y-0 lg:space-x-4">
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium my-0!">Rows per page</p>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-8 w-[80px]" aria-label={rowsPerPageLabel}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-row items-center">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            {safePageCount === 0 ? (
              <span>No pages</span>
            ) : (
              <span>
                Page {currentPage} of {safePageCount}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={(): void => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-disabled={!table.getCanPreviousPage()}
              aria-label={firstPageLabel}
            >
              <ChevronsLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>

            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={(): void => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-disabled={!table.getCanPreviousPage()}
              aria-label={previousPageLabel}
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>

            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={(): void => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-disabled={!table.getCanNextPage()}
              aria-label={nextPageLabel}
            >
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>

            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={(): void => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-disabled={!table.getCanNextPage()}
              aria-label={lastPageLabel}
            >
              <ChevronsRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
