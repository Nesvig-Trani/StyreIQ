import { describe, expect, it } from 'vitest'
import { hasSameValues } from '@/shared/utils/hasSameValues'
import { parseSearchParams, stringifySearchParams } from '@/shared/utils/searchParams'
import { requestDemoSchema } from '@/shared/schemas/requestDemoSchema'

describe('hasSameValues', () => {
  it('should ignore order and treat numeric ids and string ids as equal', () => {
    expect(hasSameValues([3, 1, 2], ['1', '2', '3'])).toBe(true)
  })

  it('should detect different membership', () => {
    expect(hasSameValues([1, 2], [1, 3])).toBe(false)
    expect(hasSameValues([1], [1, 2])).toBe(false)
  })
})

describe('search params round trip', () => {
  it('should stringify and parse pagination and search filters', () => {
    const query = stringifySearchParams({
      pageIndex: 2,
      search: 'Facultad de Artes',
      status: 'active',
    })
    expect(parseSearchParams(new URLSearchParams(query))).toEqual({
      pageIndex: 2,
      search: 'Facultad de Artes',
      status: 'active',
    })
  })

  it('should return an empty string when there are no params', () => {
    expect(stringifySearchParams({})).toBe('')
  })

  it('should return an empty object for null params', () => {
    expect(parseSearchParams(null)).toEqual({})
  })

  it('should skip values that are not valid JSON instead of throwing', () => {
    expect(parseSearchParams({ search: 'Facultad de Artes' })).toEqual({})
  })

  it('should keep repeated params as arrays', () => {
    expect(parseSearchParams(new URLSearchParams('ids=1&ids=2'))).toEqual({ ids: [1, 2] })
  })
})

describe('requestDemoSchema', () => {
  it('should trim values and accept a demo request with optional fields omitted', () => {
    const result = requestDemoSchema.parse({
      name: '  Camila Ortiz ',
      email: ' camila.ortiz@uniandes.edu.co ',
    })
    expect(result).toEqual({ name: 'Camila Ortiz', email: 'camila.ortiz@uniandes.edu.co' })
  })

  it('should reject a blank name and an invalid email', () => {
    const result = requestDemoSchema.safeParse({ name: '   ', email: 'camila.ortiz@' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toEqual(expect.arrayContaining(['Name is required', 'Enter a valid email']))
    }
  })
})
