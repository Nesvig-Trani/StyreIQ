import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { analyzeZodSchemaForRequired, determineFieldRequired, isFieldRequired } from '../utils'
import { addMinLengthValidationToRequiredStrings, buildNumberZodSchema } from '../zod-builders'
import { getFieldDefaultValue, getFieldListDefaultValues } from '../get-field-default-value'

const contactSchema = z.object({
  fullName: z.string(),
  nickname: z.string().optional(),
  phone: z.string().nullable(),
  website: z.union([z.string(), z.undefined()]),
})

describe('analyzeZodSchemaForRequired / isFieldRequired', () => {
  it('should treat plain fields as required', () => {
    expect(analyzeZodSchemaForRequired(contactSchema, 'fullName')).toBe(true)
    expect(isFieldRequired(contactSchema, 'fullName')).toBe(true)
  })

  it('should treat optional, nullable and optional-union fields as not required', () => {
    expect(analyzeZodSchemaForRequired(contactSchema, 'nickname')).toBe(false)
    expect(analyzeZodSchemaForRequired(contactSchema, 'phone')).toBe(false)
    expect(analyzeZodSchemaForRequired(contactSchema, 'website')).toBe(false)
  })

  it('should return false for non-object schemas and unknown fields', () => {
    expect(analyzeZodSchemaForRequired(z.record(z.string()), 'fullName')).toBe(false)
    const looseSchema = z.object({ fullName: z.string() }).catchall(z.string())
    expect(analyzeZodSchemaForRequired(looseSchema, 'unknown')).toBe(false)
  })
})

describe('determineFieldRequired', () => {
  it('should prefer the explicit required flag', () => {
    expect(
      determineFieldRequired(
        { name: 'nickname', label: 'Nickname', required: true },
        contactSchema,
      ),
    ).toBe(true)
  })

  it('should defer to the schema when there is no explicit flag', () => {
    expect(determineFieldRequired({ name: 'fullName', label: 'Name' }, contactSchema)).toBe(true)
    expect(determineFieldRequired({ name: 'nickname', label: 'Nickname' }, contactSchema)).toBe(
      false,
    )
  })

  it('should fall back to an asterisk in the label without a schema', () => {
    expect(determineFieldRequired({ name: 'fullName', label: 'Name *' })).toBe(true)
    expect(determineFieldRequired({ name: 'fullName', label: 'Name' })).toBe(false)
  })
})

describe('buildNumberZodSchema', () => {
  it('should coerce numeric strings', () => {
    expect(buildNumberZodSchema().parse('42.5')).toBe(42.5)
  })

  it('should reject empty and non-numeric input with the default message', () => {
    const result = buildNumberZodSchema().safeParse('')
    expect(result.success).toBe(false)
    expect(buildNumberZodSchema().safeParse('abc').error?.issues[0].message).toBe(
      'Value must be a valid number',
    )
  })

  it('should enforce integer, min and max with custom messages', () => {
    const schema = buildNumberZodSchema({
      isInteger: true,
      min: 1,
      max: 10,
      errorMessages: { isInteger: 'Solo enteros', min: 'Mínimo 1', max: 'Máximo 10' },
    })
    expect(schema.safeParse('2.5').error?.issues[0].message).toBe('Solo enteros')
    expect(schema.safeParse('0').error?.issues[0].message).toBe('Mínimo 1')
    expect(schema.safeParse('11').error?.issues[0].message).toBe('Máximo 10')
    expect(schema.parse('7')).toBe(7)
  })

  it('should use default bound messages', () => {
    const schema = buildNumberZodSchema({ min: 5, max: 8 })
    expect(schema.safeParse('1').error?.issues[0].message).toBe('Value must be greater than 5')
    expect(schema.safeParse('9').error?.issues[0].message).toBe('Value must be less than 8')
  })
})

describe('addMinLengthValidationToRequiredStrings', () => {
  it('should reject empty required strings but keep other fields untouched', () => {
    const schema = addMinLengthValidationToRequiredStrings(
      z.object({ title: z.string(), note: z.string().optional(), seats: z.number() }),
    )
    const result = schema.safeParse({ title: '', seats: 3 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('title is required')
    expect(schema.safeParse({ title: 'Lanzamiento', seats: 3 }).success).toBe(true)
  })
})

describe('getFieldDefaultValue', () => {
  it('should map each field type to its empty value', () => {
    expect(getFieldDefaultValue({ name: 'a', label: 'A', type: 'text' })).toBe('')
    expect(getFieldDefaultValue({ name: 'a', label: 'A', type: 'password' })).toBe('')
    expect(getFieldDefaultValue({ name: 'a', label: 'A', type: 'select' })).toBeNull()
    expect(getFieldDefaultValue({ name: 'a', label: 'A', type: 'date' })).toBeNull()
    expect(getFieldDefaultValue({ name: 'a', label: 'A', type: 'multiselect' })).toEqual([])
    expect(getFieldDefaultValue({ name: 'a', label: 'A', type: 'array' })).toEqual([])
  })

  it('should throw for types without a default', () => {
    expect(() => getFieldDefaultValue({ name: 'a', label: 'A', type: 'phone' })).toThrow(
      'Unsupported field type',
    )
  })

  it('should build a record for a list of fields', () => {
    expect(
      getFieldListDefaultValues([
        { name: 'contactName', label: 'Name', type: 'text' },
        { name: 'tags', label: 'Tags', type: 'multiselect' },
      ]),
    ).toEqual({ contactName: '', tags: [] })
  })
})
