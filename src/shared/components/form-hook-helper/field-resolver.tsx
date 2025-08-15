'use client'

import type { ReactNode } from 'react'
import React from 'react'
import type { ArrayPath, FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'
import {
  FormFieldUncontrolled,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'

import { CheckboxInputHelper } from './fields/checkbox'
import { DateInputHelper } from './fields/date'
import { MultiSelectInputHelper } from './fields/multiselect'
import { NumberInputHelper } from './fields/number'
import { SelectInputHelper } from './fields/select'
import { TextInputHelper } from './fields/text'
import { PasswordInputHelper } from './fields/password'
import { TextAreaHelper } from './fields/text-area'
import { PhoneInputHelper } from './fields/phone'
import { SeparatorField } from './fields/separator'
import { getFieldListDefaultValues } from './get-field-default-value'
import { FieldData } from '@/shared/components/form-hook-helper/types'
import { cn } from '@/shared/utils/cn'
import { Button } from '@/shared/components/ui/button'
import { TreeSelectHelper } from '@/shared/components/form-hook-helper/fields/tree-select'

interface FieldResolverProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>
  fieldData: FieldData<TFieldValues>
  index: number
}

export const FieldResolver = <TFieldValues extends FieldValues>({
  form,
  fieldData,
  index,
}: FieldResolverProps<TFieldValues>): ReactNode => {
  const { type = 'text', size = 'full' } = fieldData
  let sizeClassName = 'col-span-12'
  if (size === 'half') {
    sizeClassName = cn(sizeClassName, 'md:col-span-6')
  }

  // Handle separator type
  if (type === 'separator') {
    return <SeparatorField key={`separator-${index}`} />
  }

  if (type === 'text') {
    return (
      <TextInputHelper
        key={`${fieldData.name}-${index}`}
        form={form}
        fieldData={fieldData}
        className={sizeClassName}
      />
    )
  }
  if (type === 'password') {
    return (
      <PasswordInputHelper
        key={`${fieldData.name}-${index}`}
        form={form}
        fieldData={fieldData}
        className={sizeClassName}
      />
    )
  }
  if (type === 'textarea') {
    return (
      <TextAreaHelper
        key={`${fieldData.name}-${index}`}
        form={form}
        fieldData={fieldData}
        className={sizeClassName}
      />
    )
  }
  if (type === 'phone') {
    return (
      <PhoneInputHelper
        key={`${fieldData.name}-${index}`}
        form={form}
        fieldData={fieldData}
        className={sizeClassName}
      />
    )
  }
  if (type === 'number') {
    return (
      <NumberInputHelper
        key={`${fieldData.name}-${index}`}
        form={form}
        fieldData={fieldData}
        className={sizeClassName}
      />
    )
  }
  if (type === 'select') {
    return (
      <SelectInputHelper
        key={`${fieldData.name}-${index}`}
        form={form}
        fieldData={fieldData}
        className={sizeClassName}
      />
    )
  }
  if (type === 'multiselect') {
    return (
      <MultiSelectInputHelper
        key={`${fieldData.name}-${index}`}
        form={form}
        fieldData={fieldData}
        className={sizeClassName}
      />
    )
  }
  if (type === 'checkbox') {
    return (
      <CheckboxInputHelper
        key={`${fieldData.name}-${index}`}
        form={form}
        fieldData={fieldData}
        className={sizeClassName}
      />
    )
  }
  if (type === 'date') {
    return (
      <DateInputHelper
        key={`${fieldData.name}-${index}`}
        form={form}
        fieldData={fieldData}
        className={sizeClassName}
      />
    )
  }

  if (type === 'array') {
    return (
      <InputListHelper
        key={`${fieldData.name}-${index}`}
        form={form}
        fieldData={fieldData}
        className={sizeClassName}
      />
    )
  }

  if (type === 'tree-select') {
    return (
      <TreeSelectHelper
        key={`${fieldData.name}-${index}`}
        form={form}
        fieldData={fieldData}
        multiple={!!fieldData.multiple}
        className={sizeClassName}
      />
    )
  }

  throw new Error(`Unsupported field type: ${type as string}`)
}

// InputListHelper added in this same file to avoid circular dependencies
// TODO: find a way to divide FieldResolver and InputListHelper in two separate files
export type InputListHelperProps<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>
  fieldData: FieldData<TFieldValues>
  className?: string
}

export const InputListHelper = <TFieldValues extends FieldValues>({
  form,
  fieldData,
  className,
}: InputListHelperProps<TFieldValues>): React.ReactNode => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: fieldData.name as ArrayPath<TFieldValues>,
  })
  return (
    <fieldset className={cn('space-y-3', className)}>
      <FormFieldUncontrolled name={fieldData.name}>
        <FormItem className={cn('col-span-12', className)}>
          <div className="flex w-full items-center gap-4">
            <FormLabel>{fieldData.label}</FormLabel>
            <Button
              type="button"
              onClick={(): void => {
                const object = getFieldListDefaultValues(fieldData.children || [])
                // expected type is dependent of some specific types that cannot be easily inferred here
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                append(object as any)
              }}
            >
              <p>Add</p>
            </Button>
          </div>
          <FormMessage />
          {fields.map((fieldItem, index) => (
            <div
              className="grid grid-cols-12 gap-3 rounded-md border p-2"
              key={fieldItem.id}
              data-testid="fields-group-item"
            >
              {fieldData.children?.map((child) => (
                <FieldResolver
                  key={`${fieldItem.id}.${child.name}`}
                  form={form}
                  fieldData={{
                    ...child,
                    name: `${fieldData.name}.${index}.${child.name}` as Path<TFieldValues>,
                  }}
                  index={index}
                />
              )) || []}
              <div className="col-span-12">
                <Button variant="destructive" onClick={(): void => remove(index)} type="button">
                  <p>Remove</p>
                </Button>
              </div>
            </div>
          ))}
        </FormItem>
      </FormFieldUncontrolled>
    </fieldset>
  )
}
