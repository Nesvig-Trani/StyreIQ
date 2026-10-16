import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getFlagAffectedName, getStatusColor, isActivityStale } from '../utils'
import { FlagStatusEnum } from '../schemas'
import { buildFlag } from '@/shared/__tests__/fixtures'

describe('getStatusColor', () => {
  it('should map flag statuses to badge variants', () => {
    expect(getStatusColor(FlagStatusEnum.PENDING)).toBe('destructive')
    expect(getStatusColor(FlagStatusEnum.RESOLVED)).toBe('default')
    expect(getStatusColor(FlagStatusEnum.NOT_APPLICABLE)).toBe('secondary')
  })
})

describe('getFlagAffectedName', () => {
  const baseFlag = buildFlag()

  it('should use the account url with the platform label when no entity is linked', () => {
    const flag = buildFlag({
      accountUrl: 'https://instagram.com/uandina_artes',
      accountPlatform: 'instagram',
    })
    expect(getFlagAffectedName(flag)).toBe('https://instagram.com/uandina_artes (Instagram)')
  })

  it('should return the bare url when the platform is unknown', () => {
    expect(getFlagAffectedName(buildFlag({ accountUrl: 'https://uandina.edu/blog' }))).toBe(
      'https://uandina.edu/blog',
    )
  })

  it('should return an empty string when nothing identifies the account', () => {
    expect(getFlagAffectedName(baseFlag)).toBe('')
  })
})

describe('isActivityStale', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('should flag activity older than 30 days', () => {
    expect(isActivityStale('2026-09-10T00:00:00Z')).toBe(true)
  })

  it('should not flag recent activity', () => {
    expect(isActivityStale('2026-10-10T00:00:00Z')).toBe(false)
  })
})
