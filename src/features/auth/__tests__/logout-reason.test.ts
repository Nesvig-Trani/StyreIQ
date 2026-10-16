import { describe, expect, it } from 'vitest'
import { LOGOUT_REASONS, isLogoutReason } from '../utils/logoutReason'

describe('isLogoutReason', () => {
  it.each(Object.values(LOGOUT_REASONS))('should accept the known reason %s', (reason) => {
    expect(isLogoutReason(reason)).toBe(true)
  })

  it.each(['', 'expired', 'NO-UNIT-ACCESS', null, undefined, 42])('should reject %s', (value) => {
    expect(isLogoutReason(value)).toBe(false)
  })
})
