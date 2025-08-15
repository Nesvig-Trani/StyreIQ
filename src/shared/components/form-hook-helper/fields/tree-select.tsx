'use client'
import React from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'

import { TreeSelect } from '@/shared/components/tree-select'
import { FieldData } from '@/shared/components/form-hook-helper/types'
import { cn } from '@/shared/utils/cn'
import { useFieldRequired } from '../utils'

export type TreeSelectHelperProps<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>
  fieldData: FieldData<TFieldValues>
  multiple: boolean
  className?: string
}

export const TreeSelectHelper = <TFieldValues extends FieldValues>({
  form,
  fieldData,
  multiple,
  className,
}: TreeSelectHelperProps<TFieldValues>): React.ReactNode => {
  const {
    formState: { errors },
  } = form

  const error = errors[fieldData.name]
  const isRequired = useFieldRequired(form, fieldData.name, fieldData.required)

  return (
    <FormField
      control={form.control}
      name={fieldData.name}
      render={({ field }) => (
        <FormItem className={cn('col-span-12', className)}>
          <FormLabel>
            {fieldData.label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl className="w-full">
            <TreeSelect
              options={fieldData.options || []}
              tree={fieldData.tree || []}
              handleChangeAction={field.onChange}
              value={field.value}
              errors={!!error}
              multiple={multiple}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
