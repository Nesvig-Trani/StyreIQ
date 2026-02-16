import type { ReactElement } from 'react'
import React from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { FieldData } from '@/shared/components/form-hook-helper/types'
import { FormControl, FormField, FormItem, FormMessage } from '@/shared/components/ui/form'
import { cn } from '@/shared/utils/cn'
import { Textarea } from '@/shared/components/ui/textarea'
import { useFieldRequired } from '../utils'
import { FieldLabel } from '../field-label'

export type TextInputHelperProps<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>
  fieldData: FieldData<TFieldValues>
  className?: string
}

export const TextAreaHelper = <TFieldValues extends FieldValues>({
  form,
  fieldData,
  className,
}: TextInputHelperProps<TFieldValues>): React.ReactNode => {
  const isRequired = useFieldRequired(form, fieldData.name, fieldData.required)
  return (
    <FormField
      control={form.control}
      name={fieldData.name}
      key={fieldData.name}
      render={({ field }): ReactElement => (
        <FormItem className={cn('col-span-12', className)}>
          <FieldLabel
            label={fieldData.label}
            description={fieldData.description}
            required={isRequired}
          />
          <FormControl>
            <Textarea {...field} placeholder={fieldData.placeholder} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
