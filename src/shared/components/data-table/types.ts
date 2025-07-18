export type DataTableSorting<TData> = {
  column: keyof TData
  order: 'asc' | 'desc'
}

export type DataTableSearchFilter = {
  type: 'search'
  id: string
  placeholder?: string
}

export type DataTableSelectOption = {
  label: string
  value: string
}

export type DataTableSelectFilter = {
  type: 'select'
  id: string
  title: string
  allowMultiple?: boolean
  options: DataTableSelectOption[]
}

export type DataTableDateFilter = {
  type: 'date'
  id: string
  title?: string
  disabledDays?: 'past' | 'future'
}

export type DataTableDateRangeFilter = {
  type: 'date-range'
  id: string
  title?: string
  disabledDays?: 'past' | 'future'
}

export type DataTableFilter = DataTableSelectFilter | DataTableDateFilter | DataTableDateRangeFilter
export type DataTableGlobalFilter =
  | DataTableSearchFilter
  | DataTableSelectFilter
  | DataTableDateRangeFilter
