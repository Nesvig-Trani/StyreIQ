import type { Table } from '@tanstack/react-table'
import type { Matcher, SelectSingleEventHandler } from 'react-day-picker'
import { z } from 'zod'

import { getFilterValue, setFilterValue } from './helpers'
import { DatePicker } from '@/shared/components/ui/datepicker'

const dateSchema = z.date().optional().catch(undefined)

type DataTableDateFilterProps<TData> = {
  table: Table<TData>
  id: string
  isGlobal: boolean
  disabledDays?: 'past' | 'future'
}

export const DataTableDateFilter = <TData,>(
  props: DataTableDateFilterProps<TData>,
): React.ReactNode => {
  const { table, id, isGlobal, disabledDays } = props

  const value = getFilterValue(id, table, isGlobal, dateSchema)

  const handleSelect: SelectSingleEventHandler = (date) => {
    setFilterValue(id, date, table, isGlobal)
  }

  const handleGoToToday = (): void => {
    setFilterValue(id, new Date(), table, isGlobal)
  }

  const disabled: Matcher[] = []
  if (disabledDays === 'past') {
    disabled.push({ before: new Date() })
  } else if (disabledDays === 'future') {
    disabled.push({ after: new Date() })
  }

  return (
    <DatePicker
      size="sm"
      selected={value}
      onSelect={handleSelect}
      disabled={disabled}
      showOutsideDays={false}
      onGoToToday={handleGoToToday}
    />
  )
}
