'use client'

import React from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import {
  FormFieldUncontrolled,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import PhoneInput from 'react-phone-number-input'
import { cn } from '@/shared/utils/cn'
import { FieldData } from '../types'

export type PhoneInputHelperProps<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>
  fieldData: FieldData<TFieldValues>
  className?: string
}

export const PhoneInputHelper = <TFieldValues extends FieldValues>({
  form,
  fieldData,
  className,
}: PhoneInputHelperProps<TFieldValues>) => {
  return (
    <FormFieldUncontrolled name={fieldData.name}>
      <FormItem className={cn('col-span-12', className)}>
        <FormLabel>{fieldData.label}</FormLabel>
        <Controller
          name={fieldData.name}
          control={form.control}
          render={({ field }) => (
            <PhoneInput
              {...field}
              placeholder={fieldData.placeholder || 'Enter phone number'}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              international
              defaultCountry="US"
            />
          )}
        />
        <FormMessage />
      </FormItem>
    </FormFieldUncontrolled>
  )
}
