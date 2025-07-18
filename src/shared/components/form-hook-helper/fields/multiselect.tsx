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
import { MultiSelect } from '@/shared/components/multiselect'
import { cn } from '@/shared/utils/cn'

export type MultiSelectInputHelperProps<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>
  fieldData: FieldData<TFieldValues>
  className?: string
}

export const MultiSelectInputHelper = <TFieldValues extends FieldValues>({
  form,
  fieldData,
  className,
}: MultiSelectInputHelperProps<TFieldValues>): React.ReactNode => {
  return (
    <FormField
      control={form.control}
      name={fieldData.name}
      key={fieldData.name}
      render={({ field: { ...field } }): React.ReactElement => (
        <FormItem className={cn('col-span-12', className)}>
          <FormLabel>{fieldData.label}</FormLabel>
          <FormControl>
            <MultiSelect
              options={fieldData.options || []}
              onValueChange={field.onChange}
              value={field.value}
              placeholder={fieldData.placeholder || 'Select options'}
              variant="default"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
