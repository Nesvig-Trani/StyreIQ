import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildUser } from '@/shared/__tests__/fixtures'
import {
  generateNewUserComplianceTasks,
  getTaskEmailsScheduleAfterWelcome,
  SKIP_COMPLIANCE_TASK_GENERATION,
} from '../../services/generate-new-user-tasks'

describe('generate-new-user-tasks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T12:00:00.000Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should schedule task emails two minutes after the welcome email', () => {
    expect(getTaskEmailsScheduleAfterWelcome()).toBe('2026-10-16T12:02:00.000Z')
  })

  it('should expose the context flag used to skip generation', () => {
    expect(SKIP_COMPLIANCE_TASK_GENERATION).toBe('skipComplianceTaskGeneration')
  })

  it('should generate tasks and write an audit entry attributed to the actor', async () => {
    const payload = createFakePayload()
    const user = buildUser({ id: 7, tenant: 10, roles: [] })

    await generateNewUserComplianceTasks({ payload: payload.asPayload(), user, actorId: 3 })

    const audit = payload.create.mock.calls
      .map(([a]) => a)
      .find((a) => a.collection === 'audit_log')
    expect(audit?.data).toMatchObject({
      user: 3,
      action: 'compliance_task_generated',
      entity: 'users',
      tenant: 10,
    })
    expect(audit?.data.metadata.tasksGenerated).toContain('CONFIRM_2FA')
  })

  it('should attribute the audit entry to the new user when there is no actor', async () => {
    const payload = createFakePayload()

    await generateNewUserComplianceTasks({
      payload: payload.asPayload(),
      user: buildUser({ id: 7, tenant: 10, roles: [] }),
    })

    const audit = payload.create.mock.calls
      .map(([a]) => a)
      .find((a) => a.collection === 'audit_log')
    expect(audit?.data.user).toBe(7)
  })

  it('should swallow and log errors so user creation is not blocked', async () => {
    const payload = createFakePayload()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(
      generateNewUserComplianceTasks({
        payload: payload.asPayload(),
        user: buildUser({ id: 7, tenant: null }),
      }),
    ).resolves.toBeUndefined()

    expect(error).toHaveBeenCalledWith('Error generating compliance tasks:', expect.any(Error))
    expect(payload.create).not.toHaveBeenCalled()
  })
})
