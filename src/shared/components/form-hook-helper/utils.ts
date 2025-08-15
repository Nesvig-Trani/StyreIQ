import { z } from 'zod'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'

export function useFieldRequired<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  fieldName: Path<TFieldValues>,
  explicitRequired?: boolean,
): boolean {
  const { formState } = form
  const { errors } = formState

  if (explicitRequired !== undefined) {
    return explicitRequired
  }

  const fieldError = errors[fieldName]
  if (fieldError) {
    const errorMessage = fieldError.message?.toString().toLowerCase() || ''
    if (errorMessage.includes('required') || errorMessage.includes('is required')) {
      return true
    }
  }

  const fieldNameStr = fieldName.toString()
  if (fieldNameStr.includes('?') || fieldNameStr.includes('optional')) {
    return false
  }

  const { touchedFields, dirtyFields } = formState
  const isTouched = (touchedFields as Record<string, boolean>)[fieldName as string]
  const isDirty = (dirtyFields as Record<string, boolean>)[fieldName as string]

  if (isTouched || isDirty) {
    return true
  }

  return false
}

export function analyzeZodSchemaForRequired<TFieldValues extends FieldValues>(
  schema: z.ZodSchema<TFieldValues>,
  fieldName: Path<TFieldValues>,
): boolean {
  try {
    if (!(schema instanceof z.ZodObject)) return false
    const fieldSchema = schema.shape[fieldName as keyof typeof schema.shape]
    if (!fieldSchema) return false
    // Helper to check if a schema is optional/nullable
    const isOptionalType = (s: z.ZodTypeAny) =>
      s instanceof z.ZodOptional ||
      s instanceof z.ZodNullable ||
      s instanceof z.ZodUndefined ||
      s instanceof z.ZodNull
    if (isOptionalType(fieldSchema)) return false
    if (fieldSchema instanceof z.ZodUnion) {
      if (fieldSchema._def.options.some(isOptionalType)) return false
    }
    return true
  } catch {
    return false
  }
}

export function determineFieldRequired<TFieldValues extends FieldValues>(
  fieldData: { name: Path<TFieldValues>; label: React.ReactNode; required?: boolean },
  schema?: z.ZodSchema<TFieldValues>,
): boolean {
  if (fieldData.required !== undefined) {
    return fieldData.required
  }

  if (schema) {
    const schemaRequired = analyzeZodSchemaForRequired(schema, fieldData.name)
    if (schemaRequired !== null) {
      return schemaRequired
    }
  }

  return (
    !fieldData.name.toString().includes('?') &&
    !fieldData.name.toString().includes('optional') &&
    typeof fieldData.label === 'string' &&
    fieldData.label.includes('*')
  )
}

export function isFieldRequired<TFieldValues extends FieldValues>(
  schema: z.ZodSchema<TFieldValues>,
  fieldName: Path<TFieldValues>,
): boolean {
  return analyzeZodSchemaForRequired(schema, fieldName)
}
