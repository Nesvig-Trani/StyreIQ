import type { ReactNode } from 'react'
import React from 'react'
import { FieldValues, UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'

import { FieldResolver } from './field-resolver'
import type { FieldData } from './types'
import { Button } from '@/shared/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Form } from '@/shared/components/ui/form'

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
  onCancel?: () => void
  cancelContent?: React.ReactNode
  showCancel?: boolean
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
  onCancel,
  cancelContent,
  showCancel = true,
}: FormHelperProps<TSchema, TFieldValues>): React.ReactNode => {
  type TTransformedValues = z.infer<TSchema>
  const watchedValues = form.watch() // Watch all form values

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const isValid = await form.trigger()
          if (isValid) {
            const data = form.getValues()
            onSubmit(data as TTransformedValues)
          }
        }}
        className="mb-4 grid w-full grid-cols-12 gap-3"
      >
        {/* Validation Errors Summary */}
        {Object.keys(form.formState.errors).length > 0 && form.formState.isSubmitted && (
          <div className="col-span-12 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              Please fix the following errors:
            </h3>
            <ul className="text-sm text-red-700 space-y-1">
              {Object.keys(form.formState.errors).map((fieldName) => (
                <li key={fieldName}>
                  <strong className="capitalize">{fieldName}:</strong> Field is required
                </li>
              ))}
            </ul>
          </div>
        )}

        {fields.map((fieldData, index) => {
          // Check the condition for the dependent field
          const shouldRenderField =
            !fieldData.dependsOn ||
            (Array.isArray(fieldData.dependsOn.value)
              ? fieldData.dependsOn.value.includes(watchedValues[fieldData.dependsOn.field])
              : fieldData.dependsOn.value === watchedValues[fieldData.dependsOn.field])

          if (!shouldRenderField) {
            return null
          }
          return (
            <FieldResolver
              key={`${fieldData.name}-${index}`}
              form={form}
              fieldData={fieldData}
              index={index}
            />
          )
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
          <div className="col-span-12 flex gap-3 mt-3">
            {showCancel && onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                {cancelContent || 'Cancelar'}
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitContent || 'Submit'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
