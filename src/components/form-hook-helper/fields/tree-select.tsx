import React from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TreeNode } from '@/components/tree-select'
import { FieldData } from '@/components/form-hook-helper/types'

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
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder={'Select parent organization'}>
                  {fieldData.options?.find((org) => org.value === field.value)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {fieldData.tree?.map((org) => (
                  <TreeNode key={org.id} tree={org} selectedValue={field.value} />
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
