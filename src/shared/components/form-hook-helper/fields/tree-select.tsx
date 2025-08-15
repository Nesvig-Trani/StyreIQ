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

export type TreeSelectHelperProps<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>
  fieldData: FieldData<TFieldValues>
  multiple: boolean
}

export const TreeSelectHelper = <TFieldValues extends FieldValues>({
  form,
  fieldData,
  multiple,
}: TreeSelectHelperProps<TFieldValues>): React.ReactNode => {
  const {
    formState: { errors },
  } = form

  const error = errors[fieldData.name]

  // Check if field is required by checking if it's optional in the schema
  const isRequired =
    !fieldData.name.toString().includes('?') &&
    !fieldData.name.toString().includes('optional') &&
    fieldData.label?.includes('*')

  return (
    <FormField
      control={form.control}
      name={fieldData.name}
      render={({ field }) => (
        <FormItem className="w-full">
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
