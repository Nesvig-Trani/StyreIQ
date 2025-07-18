import type { Table } from '@tanstack/react-table'
import type { Matcher, SelectRangeEventHandler } from 'react-day-picker'
import { z } from 'zod'

import { getFilterValue, setFilterValue } from './helpers'
import { DateRangePicker } from '@/shared/components/ui/date-range-picker'

const dateRangeSchema = z
  .object({
    from: z.string(),
    to: z.string().optional(),
  })
  .optional()
  .catch(undefined)

type DataTableDateRangeFilterProps<TData> = {
  table: Table<TData>
  id: string
  isGlobal: boolean
  title?: string
  disabledDays?: 'past' | 'future'
}

export const DataTableDateRangeFilter = <TData,>(
  props: DataTableDateRangeFilterProps<TData>,
): React.ReactNode => {
  const { table, id, isGlobal, disabledDays } = props

  const value = getFilterValue(id, table, isGlobal, dateRangeSchema)

  const handleSelect: SelectRangeEventHandler = (range) => {
    setFilterValue(id, range, table, isGlobal)
  }

  const disabled: Matcher[] = []
  if (disabledDays === 'past') {
    disabled.push({ before: new Date() })
  } else if (disabledDays === 'future') {
    disabled.push({ after: new Date() })
  }

  return (
    <DateRangePicker
      size="sm"
      onSelect={handleSelect}
      disabled={disabled}
      showOutsideDays={false}
      selected={{
        from: value?.from ? new Date(value.from) : undefined,
        to: value?.to ? new Date(value.to) : undefined,
      }}
      {...props}
    />
  )
}
