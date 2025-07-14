'use client'

import { format } from 'date-fns'
import type { DayPickerRangeProps } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils/cn'
import { Calendar1 } from 'lucide-react'
import { Calendar } from '@/shared/components/ui/calendar'

export type DateRangePickerProps = {
  size?: React.ComponentProps<typeof Button>['size']
} & Omit<DayPickerRangeProps, 'mode'>

export const DateRangePicker: React.FC<DateRangePickerProps> = (props) => {
  const { size, ...extra } = props
  const { selected } = props

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            size={size}
            className={cn(
              'w-[180px] sm:w-[250px] lg:w-[300px] justify-start text-left font-normal',
              !selected && 'text-muted-foreground',
            )}
          >
            <Calendar1 className="mr-2 size-4" />
            {selected == null && <span className="truncate">Pick a date</span>}
            {selected != null && (
              <span className="truncate">
                {selected.from && `${format(selected.from, 'MMM dd')} - `}
                {selected.to && format(selected.to, 'MMM dd, y')}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="block sm:hidden">
            <Calendar
              initialFocus
              mode={'range'}
              defaultMonth={selected?.from}
              numberOfMonths={1}
              {...extra}
            />
          </div>
          <div className="hidden sm:block">
            <Calendar
              initialFocus
              mode={'range'}
              defaultMonth={selected?.from}
              numberOfMonths={2}
              {...extra}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
