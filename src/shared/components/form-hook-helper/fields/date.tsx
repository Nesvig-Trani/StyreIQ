import React from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { cn } from '@/shared/utils/cn'
import { FieldData } from '@/shared/components/form-hook-helper'
import { DatePicker } from '@/shared/components/ui/datepicker'

export type DateInputHelperProps<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>
  fieldData: FieldData<TFieldValues>
  className?: string
}

export const DateInputHelper = <TFieldValues extends FieldValues>({
  form,
  fieldData,
  className,
}: DateInputHelperProps<TFieldValues>): React.ReactNode => {
  return (
    <FormField
      control={form.control}
      name={fieldData.name}
      key={fieldData.name}
      render={({ field: { onChange, value } }): React.ReactElement => (
        <FormItem className={cn('col-span-12', className)}>
          <FormLabel className={cn(fieldData.disabled && 'text-muted-foreground')}>
            {fieldData.label}
          </FormLabel>
          <FormControl>
            <DatePicker
              className={cn('w-full', fieldData.disabled && 'opacity-60 cursor-not-allowed')}
              {...fieldData.dateInputProps} // TODO - Find a better way to do this
              disabled={fieldData.disabled}
              selected={value ? value : undefined}
              onSelect={(newValue: Date | undefined) => {
                if (!fieldData.disabled) {
                  onChange(newValue ?? null)
                }
              }}
              locale={undefined}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
