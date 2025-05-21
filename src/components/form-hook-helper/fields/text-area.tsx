import type { ReactElement } from 'react'
import React from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { FieldData } from '@/components/form-hook-helper/types'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

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
  return (
    <FormField
      control={form.control}
      name={fieldData.name}
      key={fieldData.name}
      render={({ field }): ReactElement => (
        <FormItem className={cn('col-span-12', className)}>
          <FormLabel>{fieldData.label}</FormLabel>
          <FormControl>
            <Textarea {...field} placeholder={fieldData.placeholder} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
