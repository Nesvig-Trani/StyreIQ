import React from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormMessage } from '@/shared/components/ui/form'
import { FieldData } from '@/shared/components/form-hook-helper'
import { MultiSelect, MultiSelectOption } from '@/shared/components/multiselect'
import { cn } from '@/shared/utils/cn'
import { useFieldRequired } from '../utils'
import { FieldLabel } from '../field-label'

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
  const isRequired = useFieldRequired(form, fieldData.name, fieldData.required)

  return (
    <FormField
      control={form.control}
      name={fieldData.name}
      key={fieldData.name}
      render={({ field: { ...field } }): React.ReactElement => (
        <FormItem className={cn('col-span-12', className)}>
          <FieldLabel
            label={fieldData.label}
            description={fieldData.description}
            required={isRequired}
          />
          <FormControl>
            <MultiSelect
              options={
                (fieldData.options?.filter(
                  (opt) => typeof opt.value === 'string',
                ) as MultiSelectOption[]) || []
              }
              onValueChange={field.onChange}
              value={field.value}
              placeholder={fieldData.placeholder || 'Select options'}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
