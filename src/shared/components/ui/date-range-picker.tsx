'use client'

import type { ComponentProps, FC } from 'react'
import { format } from 'date-fns'
import type { DayPickerRangeProps } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils/cn'
import { Calendar1 } from 'lucide-react'
import { Calendar } from '@/shared/components/ui/calendar'

export type DateRangePickerProps = {
  size?: ComponentProps<typeof Button>['size']
  /** Accessible name prefix so multiple range filters on one page are distinct (e.g. "Detection Date"). */
  filterLabel?: string
  /** Unique id for the trigger; avoids duplicate ids when several pickers render. */
  triggerId?: string
} & Omit<DayPickerRangeProps, 'mode'>

export const DateRangePicker: FC<DateRangePickerProps> = (props) => {
  const { size, filterLabel, triggerId, ...dayPickerProps } = props
  const { selected } = dayPickerProps

  const scopePrefix = filterLabel ? `${filterLabel}. ` : ''

  let ariaLabel: string
  if (selected?.from && selected?.to) {
    ariaLabel = `${scopePrefix}Date range selected: ${format(selected.from, 'MMM dd')} to ${format(selected.to, 'MMM dd, y')}`
  } else if (selected?.from) {
    ariaLabel = `${scopePrefix}Start date ${format(selected.from, 'MMM dd, y')} selected. Pick end date.`
  } else {
    ariaLabel = `${scopePrefix}Pick start and end dates.`
  }

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            variant="outline"
            size={size}
            className={cn(
              'w-[180px] sm:w-[250px] lg:w-[300px] justify-start text-left font-normal',
              !selected && 'text-muted-foreground',
            )}
            aria-label={ariaLabel}
          >
            <Calendar1 className="mr-2 size-4" aria-hidden="true" />
            {!selected && <span className="truncate">Pick a date</span>}
            {selected && (
              <span className="truncate">
                {selected.from && `${format(selected.from, 'MMM dd')} - `}
                {selected.to && format(selected.to, 'MMM dd, y')}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selected?.from}
            numberOfMonths={2}
            className="hidden sm:block"
            {...dayPickerProps}
          />
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selected?.from}
            numberOfMonths={1}
            className="block sm:hidden"
            {...dayPickerProps}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
