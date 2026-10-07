import React from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/shared/components/ui/form'
import { FieldData } from '@/shared/components/form-hook-helper'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectScrollDownButton,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { cn } from '@/shared/utils/cn'
import { SelectScrollUpButton } from '@radix-ui/react-select'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { useFieldRequired } from '../utils'
import { FieldLabel } from '../field-label'

export type SelectInputHelperProps<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>
  fieldData: FieldData<TFieldValues>
  className?: string
}

export const SelectInputHelper = <TFieldValues extends FieldValues>({
  form,
  fieldData,
  className,
}: SelectInputHelperProps<TFieldValues>): React.ReactNode => {
  const isRequired = useFieldRequired(form, fieldData.name, fieldData.required)

  if (fieldData.hidden) {
    return null
  }

  return (
    <FormField
      control={form.control}
      name={fieldData.name}
      key={fieldData.name}
      render={({ field: { onChange, value, ...field } }): React.ReactElement => {
        const canClear = !isRequired && Boolean(value)

        return (
          <FormItem className={cn('col-span-12', className)}>
            <FieldLabel
              label={fieldData.label}
              description={fieldData.description}
              required={isRequired}
            />
            <div className="relative">
              <Select
                {...field}
                value={value}
                onValueChange={(value): void => {
                  onChange(value)
                }}
              >
                <FormControl>
                  <SelectTrigger
                    className={cn('w-full', canClear && 'pr-14')}
                    aria-required={isRequired || undefined}
                  >
                    <SelectValue placeholder={fieldData.placeholder || 'Select an option'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[300px]">
                  <SelectScrollUpButton className="flex items-center justify-center">
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  </SelectScrollUpButton>
                  {fieldData.options && fieldData.options.length > 0 ? (
                    fieldData.options.map(({ label: optionLabel, value: optionValue }) => (
                      <SelectItem key={optionValue as string} value={optionValue as string}>
                        {optionLabel}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="text-muted-foreground px-4 py-2 text-sm text-center">
                      No options available
                    </div>
                  )}
                  <SelectScrollDownButton className="flex items-center justify-center">
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </SelectScrollDownButton>
                </SelectContent>
              </Select>
              {canClear ? (
                <button
                  type="button"
                  aria-label="Clear selection"
                  onClick={(): void => onChange('')}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute top-1/2 right-9 -translate-y-1/2 rounded-sm outline-none focus-visible:ring-[3px]"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            {fieldData.description ? (
              <FormDescription className="sr-only">{fieldData.description}</FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
