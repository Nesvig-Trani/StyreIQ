'use client'

import type { Table } from '@tanstack/react-table'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { MouseEventHandler } from 'react'

import { DataTableDateFilter } from './filters/date'
import { DataTableDateRangeFilter } from './filters/date-range'
import { DataTableSearchFilter } from './filters/search'
import { DataTableSelectFilter } from './filters/select'
import type { DataTableFilter, DataTableGlobalFilter } from './types'
import { DataTableViewOptions } from './view-options'
import { Button } from '@/shared/components/ui/button'
import { CrossIcon } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

type DataTableToolbarProps<TData> = {
  table: Table<TData>
  globalFiltersDefs?: DataTableGlobalFilter[]
  columnFiltersDefs?: DataTableFilter[]
}

const unreachable = (type: never): never => {
  throw new Error(`Unknown filter type: ${JSON.stringify(type)}`)
}

export const DataTableToolbar = <TData,>(props: DataTableToolbarProps<TData>): React.ReactNode => {
  const { table, globalFiltersDefs = [], columnFiltersDefs = [] } = props

  // TODO: find a way to use hooks both from next/navigation and next/router
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hasFilters = globalFiltersDefs.length > 0 || columnFiltersDefs.length > 0
  // TODO: this will probably need improvements if the page has search params
  // not related to the table
  const isFiltered = searchParams != null && searchParams.toString() !== ''

  const handleResetClick: MouseEventHandler<HTMLButtonElement> = async () => {
    if (pathname == null) {
      return
    }

    router.push(pathname)
  }

  return (
    <div className={cn('flex', hasFilters ? 'justify-between' : 'justify-end')}>
      {hasFilters && (
        <div className="flex flex-col justify-start space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
          {globalFiltersDefs.map((filter) => {
            if (filter.type === 'search') {
              return (
                <DataTableSearchFilter
                  key={filter.id}
                  table={table}
                  id={filter.id}
                  placeholder={filter.placeholder}
                />
              )
            }

            if (filter.type === 'select') {
              return (
                <DataTableSelectFilter
                  key={filter.id}
                  table={table}
                  isGlobal
                  id={filter.id}
                  title={filter.title}
                  allowMultiple={filter.allowMultiple}
                  options={filter.options}
                />
              )
            }

            if (filter.type === 'date-range') {
              return (
                <DataTableDateRangeFilter
                  key={filter.id}
                  table={table}
                  id={filter.id}
                  isGlobal
                  disabledDays={filter.disabledDays}
                />
              )
            }

            return unreachable(filter)
          })}

          {columnFiltersDefs.map((filter) => {
            if (filter.type === 'select') {
              return (
                <DataTableSelectFilter
                  key={filter.id}
                  table={table}
                  isGlobal={false}
                  id={filter.id}
                  title={filter.title}
                  allowMultiple={filter.allowMultiple}
                  options={filter.options}
                />
              )
            }

            if (filter.type === 'date') {
              return (
                <DataTableDateFilter
                  key={filter.id}
                  table={table}
                  isGlobal={false}
                  id={filter.id}
                  disabledDays={filter.disabledDays}
                />
              )
            }

            if (filter.type === 'date-range') {
              return (
                <DataTableDateRangeFilter
                  key={filter.id}
                  table={table}
                  id={filter.id}
                  isGlobal={false}
                  disabledDays={filter.disabledDays}
                />
              )
            }

            return unreachable(filter)
          })}

          {isFiltered && (
            <Button variant="ghost" onClick={handleResetClick} className="h-8 px-2 lg:px-3">
              Reset
              <CrossIcon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <DataTableViewOptions table={table} />
    </div>
  )
}
