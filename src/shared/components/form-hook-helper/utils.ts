import { z } from 'zod'
import type { FieldValues, Path } from 'react-hook-form'

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
  try {
    // Check if the schema is a ZodObject
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape
      const fieldSchema = shape[fieldName as keyof typeof shape]

      if (!fieldSchema) {
        return false
      }

      // Check if the field is optional or nullable
      if (fieldSchema instanceof z.ZodOptional || fieldSchema instanceof z.ZodNullable) {
        return false
      }

      // For ZodString, check if it has min(1) validation
      if (fieldSchema instanceof z.ZodString) {
        // This is a simplified check - in practice, you might want to traverse the schema more thoroughly
        return true
      }

      // For other types, assume required unless explicitly optional/nullable
      return true
    }

    return false
  } catch {
    // If we can't determine from schema, fall back to false
    return false
  }
}

/**
 * Determines if a field is required using multiple strategies:
 * 1. Explicit required property in fieldData
 * 2. Zod schema analysis (if schema is provided)
 * 3. Fallback to field name and label analysis
 */
export function determineFieldRequired<TFieldValues extends FieldValues>(
  fieldData: { name: Path<TFieldValues>; label: React.ReactNode; required?: boolean },
  schema?: z.ZodSchema<TFieldValues>,
): boolean {
  // 1. Use explicit required property if provided
  if (fieldData.required !== undefined) {
    return fieldData.required
  }

  // 2. Try to determine from Zod schema if provided
  if (schema) {
    const schemaRequired = isFieldRequired(schema, fieldData.name)
    if (schemaRequired !== null) {
      return schemaRequired
    }
  }

  // 3. Fallback to field name and label analysis
  return (
    !fieldData.name.toString().includes('?') &&
    !fieldData.name.toString().includes('optional') &&
    typeof fieldData.label === 'string' &&
    fieldData.label.includes('*')
  )
}
