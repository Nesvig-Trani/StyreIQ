import React from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { FieldData } from '@/shared/components/form-hook-helper'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectScrollDownButton,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { cn } from '@/shared/utils/cn'
import { SelectScrollUpButton } from '@radix-ui/react-select'
import { ChevronDown, ChevronUp } from 'lucide-react'

export type SelectInputHelperProps<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>
  fieldData: FieldData<TFieldValues>
  className?: string
}

export const SelectInputHelper = <TFieldValues extends FieldValues>({
  form,
  fieldData,
  className,
}: SelectInputHelperProps<TFieldValues>): React.ReactNode => {
  return (
    <FormField
      control={form.control}
      name={fieldData.name}
      key={fieldData.name}
      render={({ field: { onChange, ...field } }): React.ReactElement => (
        <FormItem className={cn('col-span-12', className)}>
          <FormLabel>{fieldData.label}</FormLabel>
          <Select
            {...field}
            onValueChange={(value): void => {
              onChange(value)
            }}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={fieldData.placeholder || 'Select an option'} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="max-h-[300px]">
              <SelectScrollUpButton className="flex items-center justify-center">
                <ChevronUp className="h-4 w-4" />
              </SelectScrollUpButton>
              {fieldData.options && fieldData.options.length > 0 ? (
                fieldData.options.map(({ label: optionLabel, value: optionValue }) => (
                  <SelectItem key={optionValue} value={optionValue}>
                    {optionLabel}
                  </SelectItem>
                ))
              ) : (
                <div className="text-muted-foreground px-4 py-2 text-sm text-center">
                  No options available
                </div>
              )}

              <SelectScrollDownButton className="flex items-center justify-center">
                <ChevronDown className="h-4 w-4" />
              </SelectScrollDownButton>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
