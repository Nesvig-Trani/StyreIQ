'use client'

import { format } from 'date-fns'
import type { DayPickerRangeProps } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Calendar1 } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'

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
              'w-[300px] justify-start text-left font-normal',
              !selected && 'text-muted-foreground',
            )}
          >
            <Calendar1 className="mr-2 size-4" />
            {selected == null && <span>Pick a date</span>}
            {selected != null && (
              <>
                {selected.from && `${format(selected.from, 'LLL dd, y')} - `}
                {selected.to && format(selected.to, 'LLL dd, y')}
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode={'range'}
            defaultMonth={selected?.from}
            numberOfMonths={2}
            {...extra}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
