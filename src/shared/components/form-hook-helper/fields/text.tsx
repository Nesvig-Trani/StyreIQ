import type { ReactElement } from 'react'
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
import { Input } from '@/shared/components/ui/input'
import { FieldData } from '@/shared/components/form-hook-helper'

export type TextInputHelperProps<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>
  fieldData: FieldData<TFieldValues>
  className?: string
}

export const TextInputHelper = <TFieldValues extends FieldValues>({
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
            <Input type={fieldData.type} {...field} placeholder={fieldData.placeholder} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
