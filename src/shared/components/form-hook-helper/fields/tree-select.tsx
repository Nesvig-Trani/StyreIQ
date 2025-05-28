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
}

export const TreeSelectHelper = <TFieldValues extends FieldValues>({
  form,
  fieldData,
}: TreeSelectHelperProps<TFieldValues>): React.ReactNode => {
  return (
    <FormField
      control={form.control}
      name={fieldData.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{fieldData.label}</FormLabel>
          <FormControl>
            <TreeSelect
              options={fieldData.options || []}
              tree={fieldData.tree || []}
              onChange={field.onChange}
              value={field.value}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
