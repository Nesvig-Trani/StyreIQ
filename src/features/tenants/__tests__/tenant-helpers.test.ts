import { describe, expect, it } from 'vitest'
import {
  extractTenantId,
  extractTenantIdFromProperty,
} from '../plugins/collections/helpers/access-control-helpers'
import { buildUser } from '@/shared/__tests__/fixtures'

describe('extractTenantId (tenant isolation, GIQ-85)', () => {
  it('should read a numeric tenant id', () => {
    expect(extractTenantId({ ...buildUser({ tenant: 10 }), collection: 'users' as const })).toBe(10)
  })

  it('should return null for users without a tenant or without a user', () => {
    expect(
      extractTenantId({ ...buildUser({ tenant: null }), collection: 'users' as const }),
    ).toBeNull()
    expect(extractTenantId(null)).toBeNull()
    expect(extractTenantId(undefined)).toBeNull()
  })
})

describe('extractTenantIdFromProperty', () => {
  it('should accept an id or a populated tenant', () => {
    expect(extractTenantIdFromProperty(7)).toBe(7)
    expect(extractTenantIdFromProperty(null)).toBeNull()
    expect(extractTenantIdFromProperty(undefined)).toBeNull()
  })
})
