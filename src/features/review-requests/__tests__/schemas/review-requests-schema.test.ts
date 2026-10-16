import { describe, expect, it } from 'vitest'
import { setUserStatusSchema } from '../../schemas'

describe('setUserStatusSchema', () => {
  it('should accept an approval without a reason', () => {
    expect(setUserStatusSchema.safeParse({ id: 41, approved: true }).success).toBe(true)
  })

  it('should require a reason when rejecting', () => {
    const result = setUserStatusSchema.safeParse({ id: 41, approved: false })
    expect(result.error?.issues[0]).toMatchObject({
      path: ['reason'],
      message: 'Reason is required when approved is false.',
    })
  })

  it('should treat a whitespace-only reason as missing', () => {
    expect(setUserStatusSchema.safeParse({ id: 41, approved: false, reason: '   ' }).success).toBe(
      false,
    )
  })

  it('should accept a rejection with a reason', () => {
    const result = setUserStatusSchema.safeParse({
      id: 41,
      approved: false,
      reason: 'La cuenta no pertenece a la Universidad Andina',
    })
    expect(result.success).toBe(true)
  })
})
