'use client'

import { format, isToday } from 'date-fns'
import * as React from 'react'
import type { DayPickerSingleProps } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Calendar1Icon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'

export type DatePickerProps = {
  onGoToToday?: () => void
  size?: React.ComponentProps<typeof Button>['size']
} & Omit<DayPickerSingleProps, 'mode'>

export const DatePicker: React.FC<DatePickerProps> = (props) => {
  const { selected, onGoToToday, size } = props

  const isSelectedToday = selected != null && isToday(selected)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={cn(
            'justify-start text-left font-normal',
            !selected && 'text-muted-foreground',
          )}
        >
          <Calendar1Icon className="mr-2 h-4 w-4" />
          {selected ? format(selected, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" initialFocus defaultMonth={selected} {...props} />
        {onGoToToday != null && !isSelectedToday && (
          <div className="flex justify-end p-2">
            <Button onClick={onGoToToday}>Go to today</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
