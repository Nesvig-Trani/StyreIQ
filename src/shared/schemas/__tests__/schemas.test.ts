import { describe, expect, it } from 'vitest'
import { paginationSchema } from '../pagination'
import { requestDemoSchema } from '../requestDemoSchema'

describe('paginationSchema', () => {
  it('should default to the first page of ten items', () => {
    expect(paginationSchema.parse({})).toEqual({ pagination: { pageIndex: 0, pageSize: 10 } })
  })

  it('should coerce numeric strings coming from the URL', () => {
    expect(paginationSchema.parse({ pagination: { pageIndex: '3', pageSize: '25' } })).toEqual({
      pagination: { pageIndex: 3, pageSize: 25 },
    })
  })

  it('should fall back to defaults for invalid values', () => {
    expect(paginationSchema.parse({ pagination: { pageIndex: -2, pageSize: 0 } })).toEqual({
      pagination: { pageIndex: 0, pageSize: 10 },
    })
    expect(paginationSchema.parse({ pagination: { pageIndex: 'abc', pageSize: 'xyz' } })).toEqual({
      pagination: { pageIndex: 0, pageSize: 10 },
    })
  })
})

describe('requestDemoSchema', () => {
  it('should trim fields and accept a minimal valid request', () => {
    const result = requestDemoSchema.parse({
      name: '  Valentina Restrepo ',
      email: ' valentina.restrepo@universidad-andina.edu ',
    })
    expect(result).toEqual({
      name: 'Valentina Restrepo',
      email: 'valentina.restrepo@universidad-andina.edu',
    })
  })

  it('should accept optional company and role', () => {
    const result = requestDemoSchema.safeParse({
      name: 'Rafael Mejía',
      email: 'rafael.mejia@universidad-andina.edu',
      company: 'Universidad Andina',
      role: 'Director de Comunicaciones',
    })
    expect(result.success).toBe(true)
  })

  it('should report a blank name and a malformed email', () => {
    const result = requestDemoSchema.safeParse({ name: '   ', email: 'no-es-un-correo' })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map((issue) => issue.message)
    expect(messages).toEqual(['Name is required', 'Enter a valid email'])
  })
})
