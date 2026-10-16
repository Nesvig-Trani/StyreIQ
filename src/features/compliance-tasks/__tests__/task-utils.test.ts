import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calcDaysFromToday, toDateOnly } from '../utils'
import {
  getActionUrlForTask,
  getTaskStatusColor,
  getTaskStatusLabel,
  getTaskTypeLabel,
  isTaskPastDue,
} from '../constants/taskHelpers'
import { ComplianceTaskStatus, ComplianceTaskType } from '../schema'
import { buildComplianceTask } from '@/shared/__tests__/fixtures'

describe('calcDaysFromToday', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 16, 15, 45))
  })
  afterEach(() => vi.useRealTimers())

  it('should count whole days until a future due date, ignoring the time of day', () => {
    const { daysUntilDue, daysSinceDue } = calcDaysFromToday('2026-10-20T08:00:00')
    expect(daysUntilDue).toBe(4)
    expect(daysSinceDue).toBe(-4)
  })

  it('should count days since an overdue date', () => {
    const { daysUntilDue, daysSinceDue } = calcDaysFromToday('2026-10-09T23:59:00')
    expect(daysSinceDue).toBe(7)
    expect(daysUntilDue).toBe(-7)
  })

  it('should treat a task due today as zero days away', () => {
    expect(calcDaysFromToday('2026-10-16T23:00:00')).toMatchObject({
      daysUntilDue: 0,
      daysSinceDue: 0,
    })
  })
})

describe('toDateOnly', () => {
  it('should drop the time portion', () => {
    const d = toDateOnly('2026-10-16T18:20:10')
    expect([d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([0, 0, 0])
  })
})

describe('task helpers', () => {
  it('should treat overdue and escalated tasks as past due (GIQ-95: escalated tasks stay completable)', () => {
    expect(isTaskPastDue(ComplianceTaskStatus.OVERDUE)).toBe(true)
    expect(isTaskPastDue(ComplianceTaskStatus.ESCALATED)).toBe(true)
    expect(isTaskPastDue(ComplianceTaskStatus.PENDING)).toBe(false)
    expect(isTaskPastDue(ComplianceTaskStatus.COMPLETED)).toBe(false)
  })

  it('should label statuses and fall back to the raw value', () => {
    expect(getTaskStatusLabel(ComplianceTaskStatus.ESCALATED)).toBe('Escalated')
    expect(getTaskStatusLabel('ARCHIVED')).toBe('ARCHIVED')
  })

  it('should color past-due tasks as destructive and completed ones as secondary', () => {
    expect(getTaskStatusColor('OVERDUE')).toBe('destructive')
    expect(getTaskStatusColor('ESCALATED')).toBe('destructive')
    expect(getTaskStatusColor('COMPLETED')).toBe('secondary')
    expect(getTaskStatusColor('PENDING')).toBe('default')
  })

  it('should label task types and fall back to the raw value', () => {
    expect(getTaskTypeLabel(ComplianceTaskType.POLICY_ACKNOWLEDGMENT)).toBe('Acknowledge Policy')
    expect(getTaskTypeLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW')
  })

  it('should link each task to its compliance page', () => {
    const task = buildComplianceTask({ id: 88, type: 'CONFIRM_2FA' })
    expect(getActionUrlForTask(task)).toBe('/dashboard/compliance/2fa/88')
  })
})
