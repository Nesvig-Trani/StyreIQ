import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { getErrorMessage } from '@/shared/utils/getErrorMessage'
import { isApiError } from '@/shared/utils/isApiError'
import { parseSearchParamsWithSchema } from '@/shared/utils/parseParamsServer'
import { cn } from '@/shared/utils/cn'
import { focusableHeadingClassName } from '@/shared/utils/a11y-styles'

describe('getErrorMessage', () => {
  const fallback = 'Something went wrong'

  it('should use a plain string error', () => {
    expect(getErrorMessage('Dominio duplicado', fallback)).toBe('Dominio duplicado')
  })

  it('should fall back for empty strings and unknown values', () => {
    expect(getErrorMessage('', fallback)).toBe(fallback)
    expect(getErrorMessage(undefined, fallback)).toBe(fallback)
    expect(getErrorMessage(42, fallback)).toBe(fallback)
  })

  it('should read the first message of a Payload errors array', () => {
    expect(
      getErrorMessage({ errors: [{ message: 'The email is already registered' }] }, fallback),
    ).toBe('The email is already registered')
  })

  it('should read the error of a custom endpoint response', () => {
    expect(getErrorMessage({ error: 'Cannot access unit from different tenant' }, fallback)).toBe(
      'Cannot access unit from different tenant',
    )
  })

  it('should read nested data messages', () => {
    expect(getErrorMessage({ data: { error: 'Tenant not found' } }, fallback)).toBe(
      'Tenant not found',
    )
  })

  it('should read the message of an Error', () => {
    expect(getErrorMessage(new Error('Failed to create unit'), fallback)).toBe(
      'Failed to create unit',
    )
  })

  it('should prefer the fallback over browser specific network errors', () => {
    expect(getErrorMessage(new TypeError('Failed to fetch'), fallback)).toBe(fallback)
  })

  it('should skip errors arrays whose first entry has no message', () => {
    expect(getErrorMessage({ errors: [{}], error: 'Forbidden' }, fallback)).toBe('Forbidden')
  })
})

describe('isApiError', () => {
  it('should accept objects with a data property', () => {
    expect(isApiError({ data: { message: 'Not allowed' } })).toBe(true)
  })

  it('should reject null, primitives and objects without data', () => {
    expect(isApiError(null)).toBe(false)
    expect(isApiError('error')).toBe(false)
    expect(isApiError(new Error('boom'))).toBe(false)
  })
})

describe('parseSearchParamsWithSchema', () => {
  const schema = z.object({
    search: z.string().optional(),
    pagination: z.object({ pageIndex: z.number() }).optional(),
    tenantId: z.array(z.string()).optional(),
  })

  it('should parse an empty object when there are no params', () => {
    expect(parseSearchParamsWithSchema(undefined, schema)).toEqual({})
  })

  it('should decode and JSON parse encoded values, keeping raw strings otherwise', () => {
    const result = parseSearchParamsWithSchema(
      {
        pagination: encodeURIComponent(JSON.stringify({ pageIndex: 3 })),
        search: 'Facultad de Artes',
      },
      schema,
    )
    expect(result).toEqual({ pagination: { pageIndex: 3 }, search: 'Facultad de Artes' })
  })

  it('should keep array values and skip undefined ones', () => {
    expect(
      parseSearchParamsWithSchema({ tenantId: ['10', '11'], search: undefined }, schema),
    ).toEqual({ tenantId: ['10', '11'] })
  })

  it('should throw when the params do not satisfy the schema', () => {
    expect(() => parseSearchParamsWithSchema({ pagination: '{"pageIndex":"x"}' }, schema)).toThrow()
  })
})

describe('class name helpers', () => {
  it('should merge conflicting tailwind classes keeping the last one', () => {
    expect(cn('px-2 py-1', 'px-4', false && 'hidden', ['font-bold'])).toBe('py-1 px-4 font-bold')
  })

  it('should expose a visible focus ring for programmatically focusable headings', () => {
    expect(focusableHeadingClassName).toContain('focus-visible:ring-2')
  })
})
