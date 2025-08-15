import { z } from 'zod'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'

/**
 * Determines if a field is required using React Hook Form's validation state
 * This is the preferred method as it uses the actual form validation
 */
export function useFieldRequired<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  fieldName: Path<TFieldValues>,
  explicitRequired?: boolean,
): boolean {
  const { formState } = form
  const { errors } = formState

  // 1. Use explicit required property if provided
  if (explicitRequired !== undefined) {
    return explicitRequired
  }

  // 2. Check if the field has validation errors that indicate it's required
  const fieldError = errors[fieldName]
  if (fieldError) {
    // If there's a validation error, the field is likely required
    // We can check the error type to be more specific
    const errorMessage = fieldError.message?.toString().toLowerCase() || ''
    if (errorMessage.includes('required') || errorMessage.includes('is required')) {
      return true
    }
  }

  // 3. Check if the field name indicates it's optional (legacy fallback)
  const fieldNameStr = fieldName.toString()
  if (fieldNameStr.includes('?') || fieldNameStr.includes('optional')) {
    return false
  }

  // 4. Check if the field has been touched and has a value (indicates it's required)
  const { touchedFields, dirtyFields } = formState
  const isTouched = (touchedFields as Record<string, boolean>)[fieldName as string]
  const isDirty = (dirtyFields as Record<string, boolean>)[fieldName as string]

  // If the field has been interacted with and is required, it would show validation errors
  // This is a heuristic approach
  if (isTouched || isDirty) {
    return true
  }

  // 5. Default to false for safety
  return false
}

/**
 * Enhanced function that can analyze Zod schema to determine if a field is required
 * This provides the most accurate validation based on the actual schema
 */
export function analyzeZodSchemaForRequired<TFieldValues extends FieldValues>(
  schema: z.ZodSchema<TFieldValues>,
  fieldName: Path<TFieldValues>,
): boolean {
  try {
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape
      const fieldSchema = shape[fieldName as keyof typeof shape]

      if (!fieldSchema) {
        return false
      }

      // Check if the field is explicitly optional
      if (fieldSchema instanceof z.ZodOptional || fieldSchema instanceof z.ZodNullable) {
        return false
      }

      // Check if it's a union with undefined/null
      if (fieldSchema instanceof z.ZodUnion) {
        const options = fieldSchema._def.options
        const hasOptional = options.some(
          (option: z.ZodTypeAny) =>
            option instanceof z.ZodUndefined ||
            option instanceof z.ZodNull ||
            option instanceof z.ZodOptional,
        )
        if (hasOptional) {
          return false
        }
      }

      // For other types, assume required unless explicitly optional
      return true
    }

    return false
  } catch {
    return false
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use useFieldRequired instead
 */
export function determineFieldRequired<TFieldValues extends FieldValues>(
  fieldData: { name: Path<TFieldValues>; label: React.ReactNode; required?: boolean },
  schema?: z.ZodSchema<TFieldValues>,
): boolean {
  // Use explicit required property if provided
  if (fieldData.required !== undefined) {
    return fieldData.required
  }

  // Try to analyze Zod schema if provided
  if (schema) {
    const schemaRequired = analyzeZodSchemaForRequired(schema, fieldData.name)
    if (schemaRequired !== null) {
      return schemaRequired
    }
  }

  // Fallback to field name and label analysis (legacy behavior)
  return (
    !fieldData.name.toString().includes('?') &&
    !fieldData.name.toString().includes('optional') &&
    typeof fieldData.label === 'string' &&
    fieldData.label.includes('*')
  )
}

/**
 * Determines if a field is required based on the Zod schema
 * @param schema The Zod schema object
 * @param fieldName The field name to check
 * @returns true if the field is required, false otherwise
 */
export function isFieldRequired<TFieldValues extends FieldValues>(
  schema: z.ZodSchema<TFieldValues>,
  fieldName: Path<TFieldValues>,
): boolean {
  return analyzeZodSchemaForRequired(schema, fieldName)
}
