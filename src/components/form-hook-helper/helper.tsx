import type { ReactNode } from 'react'
import React from 'react'
import { FieldValues, UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'

import { FieldResolver } from './field-resolver'
import type { FieldData } from './types'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Form } from '@/components/ui/form'

export type FormHelperProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TSchema extends z.Schema<any, any>,
  TFieldValues extends FieldValues,
> = {
  form: UseFormReturn<TFieldValues>
  fields: FieldData<TFieldValues>[]
  isLoading?: boolean
  submitContent?: React.ReactNode
  onSubmit: (values: z.infer<TSchema>) => unknown
  customSubmit?: boolean
  error?: {
    error: string
    code?: string | undefined
    validationErrors?:
      | {
          message: string
          fields: string[]
        }[]
      | undefined
  } | null
  customComponent?: ReactNode
}

/**
 * Avoid using this component directly, this will be used internally by the useFormHelper hook
 */
export const FormHelper = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TSchema extends z.Schema<any, any>,
  TFieldValues extends FieldValues,
>({
  form,
  fields,
  isLoading,
  submitContent,
  onSubmit,
  customSubmit,
  error,
  customComponent,
}: FormHelperProps<TSchema, TFieldValues>): React.ReactNode => {
  type TTransformedValues = z.infer<TSchema>
  const watchedValues = form.watch() // Watch all form values
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data: TTransformedValues) => onSubmit(data))}
        className="mb-4 grid w-full grid-cols-12 gap-3"
      >
        {fields.map((fieldData) => {
          // Check the condition for the dependent field
          const shouldRenderField =
            !fieldData.dependsOn ||
            fieldData.dependsOn.value === watchedValues[fieldData.dependsOn.field]
          if (!shouldRenderField) {
            return null
          }
          return <FieldResolver key={fieldData.name} form={form} fieldData={fieldData} />
        })}
        {error?.validationErrors && (
          <ul>
            {error.validationErrors.map((validationError) => (
              <li key={validationError.message}>
                {validationError.message} ({'fields'}: {validationError.fields.join(', ')})
              </li>
            ))}
          </ul>
        )}
        {customComponent}
        {!customSubmit && (
          <Button className="col-span-12" type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitContent || 'Submit'}
          </Button>
        )}
      </form>
    </Form>
  )
}
