import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildComplianceTask, buildUser } from '@/shared/__tests__/fixtures'
import { buildTenant } from '../fixtures'
import type { ComplianceTask } from '@/types/payload-types'

const fakePayload = vi.hoisted(() => ({
  current: null as ReturnType<typeof createFakePayload> | null,
}))

vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: fakePayload.current!.asPayload() }),
}))

import { createRecurringPasswordTasks } from '../../task/createRecurringPassword'

type Where = { and?: Record<string, { in?: string[]; equals?: string | number | boolean }>[] }

const isCompletedQuery = (where: Where) =>
  where.and?.some((clause) => clause.status?.equals === 'COMPLETED') ?? false

const taskTypeOf = (where: Where) => where.and?.find((c) => c.type)?.type?.equals

describe('createRecurringPasswordTasks', () => {
  let payload: ReturnType<typeof createFakePayload>
  const member = buildUser({ id: 7, name: 'Mateo Salazar' })

  const stubWorld = (options: {
    tenant?: ReturnType<typeof buildTenant>
    completed?: Partial<Record<ComplianceTask['type'], string>>
    pending?: ComplianceTask['type'][]
    sharedAccounts?: number
  }) => {
    payload.find.mockImplementation(
      async ({ collection, where }: { collection: string; where: Where }) => {
        if (collection === 'tenants')
          return { docs: [options.tenant ?? buildTenant()], totalDocs: 1 }
        if (collection === 'users') return { docs: [member], totalDocs: 1 }
        if (collection === 'social-medias') {
          const total = options.sharedAccounts ?? 0
          return { docs: Array(total).fill({ id: 1 }), totalDocs: total }
        }
        const type = taskTypeOf(where) as ComplianceTask['type']
        if (isCompletedQuery(where)) {
          const completedAt = options.completed?.[type]
          return completedAt
            ? {
                docs: [buildComplianceTask({ type, status: 'COMPLETED', completedAt })],
                totalDocs: 1,
              }
            : { docs: [], totalDocs: 0 }
        }
        const hasPending = options.pending?.includes(type) ?? false
        return {
          docs: hasPending ? [buildComplianceTask({ type })] : [],
          totalDocs: hasPending ? 1 : 0,
        }
      },
    )
  }

  const createdTaskTypes = () =>
    payload.create.mock.calls
      .map(([args]) => args)
      .filter((args) => args.collection === 'compliance_tasks')
      .map((args) => args.data.type)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T12:00:00.000Z'))
    payload = createFakePayload()
    fakePayload.current = payload
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should create a password and 2FA task when the last completion is older than the default 180 days', async () => {
    stubWorld({
      completed: {
        CONFIRM_USER_PASSWORD: '2026-04-01T10:00:00.000Z',
        CONFIRM_2FA: '2026-04-01T10:00:00.000Z',
      },
    })

    await createRecurringPasswordTasks()

    expect(createdTaskTypes().sort()).toEqual(['CONFIRM_2FA', 'CONFIRM_USER_PASSWORD'])
    const created = payload.create.mock.calls[0][0].data
    expect(created).toMatchObject({
      assignedUser: 7,
      tenant: 10,
      status: 'PENDING',
      remindersSent: [],
      escalations: [],
    })
    expect(created.dueDate).toBe('2026-11-15T12:00:00.000Z')
  })

  it('should not create a task when the last completion is within the cadence', async () => {
    stubWorld({ completed: { CONFIRM_USER_PASSWORD: '2026-09-01T10:00:00.000Z' } })

    await createRecurringPasswordTasks()

    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should not create a task when the user has never completed one', async () => {
    stubWorld({})

    await createRecurringPasswordTasks()

    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should not create a task when one is already pending', async () => {
    stubWorld({
      completed: { CONFIRM_USER_PASSWORD: '2025-01-01T10:00:00.000Z' },
      pending: ['CONFIRM_USER_PASSWORD'],
    })

    await createRecurringPasswordTasks()

    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should use the tenant password update cadence', async () => {
    const tenant = buildTenant({ governanceSettings: { passwordUpdateCadenceDays: 30 } })
    stubWorld({ tenant, completed: { CONFIRM_USER_PASSWORD: '2026-09-01T10:00:00.000Z' } })

    await createRecurringPasswordTasks()

    expect(createdTaskTypes()).toEqual(['CONFIRM_USER_PASSWORD'])
  })

  it('should create the shared password task only when the user manages a shared-credential account', async () => {
    stubWorld({
      sharedAccounts: 1,
      completed: { CONFIRM_SHARED_PASSWORD: '2026-01-01T10:00:00.000Z' },
    })
    await createRecurringPasswordTasks()
    expect(createdTaskTypes()).toEqual(['CONFIRM_SHARED_PASSWORD'])

    payload.create.mockClear()
    stubWorld({
      sharedAccounts: 0,
      completed: { CONFIRM_SHARED_PASSWORD: '2026-01-01T10:00:00.000Z' },
    })
    await createRecurringPasswordTasks()
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should log and continue when a tenant fails to process', async () => {
    payload.find.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === 'tenants') return { docs: [buildTenant()], totalDocs: 1 }
      throw new Error('db unavailable')
    })

    await createRecurringPasswordTasks()

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to process recurring tasks for tenant 10'),
      expect.any(Error),
    )
  })

  it('should log and continue when a user fails to process', async () => {
    stubWorld({})
    const original = payload.find.getMockImplementation()!
    payload.find.mockImplementation(async (args: { collection: string; where: Where }) => {
      if (args.collection === 'compliance_tasks') throw new Error('query failed')
      return original(args)
    })

    await createRecurringPasswordTasks()

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to process user 7'),
      expect.any(Error),
    )
  })
})
