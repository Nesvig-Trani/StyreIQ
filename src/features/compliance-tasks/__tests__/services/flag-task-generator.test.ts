import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildFlag, buildUser } from '@/shared/__tests__/fixtures'
import { FlagTaskGenerator } from '../../services/flag-task-generator'

describe('FlagTaskGenerator', () => {
  const creator = buildUser({
    id: 1,
    name: 'Camila Ortega',
    email: 'camila.ortega@universidad-andina.edu',
  })
  const assignee = buildUser({
    id: 7,
    name: 'Mateo Salazar',
    email: 'mateo.salazar@universidad-andina.edu',
  })
  let payload: ReturnType<typeof createFakePayload>

  beforeEach(() => {
    payload = createFakePayload()
    payload.create.mockResolvedValue({
      id: 90,
      type: 'REVIEW_FLAG',
      dueDate: '2026-11-01T00:00:00.000Z',
    })
    payload.findByID.mockResolvedValue(assignee)
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('should skip flags without an assignee or due date', async () => {
    await new FlagTaskGenerator(payload.asPayload()).createTaskForFlag(
      buildFlag({ assignedTo: 7 }),
      creator,
    )

    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should reject flags without a tenant', async () => {
    const flag = buildFlag({
      assignedTo: 7,
      dueDate: '2026-11-01T00:00:00.000Z',
      tenant: undefined,
    })

    await expect(
      new FlagTaskGenerator(payload.asPayload()).createTaskForFlag(flag, creator),
    ).rejects.toThrow('no tenant')
  })

  it('should not create another task when a review task is already open', async () => {
    payload.find.mockResolvedValue({ docs: [{ id: 1 }], totalDocs: 1 })
    const flag = buildFlag({
      id: 5,
      assignedTo: 7,
      tenant: 10,
      dueDate: '2026-11-01T00:00:00.000Z',
    })

    await new FlagTaskGenerator(payload.asPayload()).createTaskForFlag(flag, creator)

    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should create a review task and email both assignee and creator', async () => {
    const flag = buildFlag({
      id: 5,
      flagType: 'OVERDUE_SECURITY_TASK',
      assignedTo: 7,
      tenant: 10,
      dueDate: '2026-11-01T00:00:00.000Z',
    })

    await new FlagTaskGenerator(payload.asPayload()).createTaskForFlag(flag, creator)

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'compliance_tasks',
        data: expect.objectContaining({
          type: 'REVIEW_FLAG',
          assignedUser: 7,
          tenant: 10,
          relatedFlag: 5,
          description: 'Review and resolve risk flag: OVERDUE_SECURITY_TASK',
        }),
      }),
    )
    expect(payload.sendEmail).toHaveBeenCalledTimes(2)
    expect(payload.sendEmail.mock.calls[1][0].to).toBe('camila.ortega@universidad-andina.edu')
  })

  it('should not notify the creator when they assigned the flag to themselves', async () => {
    payload.findByID.mockResolvedValue(creator)
    const flag = buildFlag({
      id: 6,
      assignedTo: creator,
      tenant: 10,
      dueDate: '2026-11-01T00:00:00.000Z',
    })

    await new FlagTaskGenerator(payload.asPayload()).createTaskForFlag(flag, creator)

    expect(payload.sendEmail).toHaveBeenCalledTimes(1)
  })
})
