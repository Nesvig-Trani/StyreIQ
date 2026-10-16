import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakePayload, type FakePayload } from '@/shared/__tests__/payload-fakes'
import { buildComplianceTask, buildFlag, buildUser } from '@/shared/__tests__/fixtures'

const context = vi.hoisted(() => ({ payload: null as FakePayload | null }))

vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: context.payload?.asPayload() }),
}))

import { findRisksAndCreateFlag } from '../../plugins/tasks/detectRisks'
import { detectRisksTask } from '../../plugins/tasks/detectRisks/def'

const tenant = { id: 10, name: 'Universidad Andina' }

type FindArgs = { collection: string; where?: unknown }

const routeFind = (
  payload: FakePayload,
  results: Partial<Record<string, unknown[]>>,
  failing: string[] = [],
) => {
  payload.find.mockImplementation(async ({ collection }: FindArgs) => {
    if (failing.includes(collection)) throw new Error(`${collection} query failed`)
    const docs = results[collection] ?? []
    return { docs, totalDocs: docs.length }
  })
}

const createdFlags = (payload: FakePayload) =>
  payload.create.mock.calls.filter(([arg]) => arg.collection === 'flags').map(([arg]) => arg.data)

describe('findRisksAndCreateFlag', () => {
  let payload: FakePayload

  beforeEach(() => {
    payload = createFakePayload()
    context.payload = payload
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T12:00:00Z'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should report nothing to do when there are no active tenants', async () => {
    routeFind(payload, { tenants: [] })

    const result = await findRisksAndCreateFlag()

    expect(result).toEqual({ success: true, message: 'No active tenants to process' })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should create one automated flag per failing check, without duplicating shared flag types', async () => {
    // Both training checks map to the same flag type, so only one flag must be created for it.
    const user = buildUser({
      id: 42,
      organizations: [100],
      isEnabledTwoFactor: true,
      isInUseSecurePassword: true,
      admin_policy_agreement: true,
      isCompletedTrainingAccessibility: false,
      isCompletedTrainingRisk: false,
    })
    routeFind(payload, { tenants: [tenant], users: [user] })

    const result = await findRisksAndCreateFlag()

    expect(result).toMatchObject({
      success: true,
      summary: { total: 1, succeeded: 1, failed: 0, totalFlagsCreated: 1 },
    })
    const flags = createdFlags(payload)
    expect(flags).toHaveLength(1)
    expect(flags[0]).toMatchObject({
      affectedEntity: { relationTo: 'users', value: 42 },
      flagType: 'incomplete_training',
      source: 'automated',
      status: 'pending',
      tenant: 10,
      organizations: [100],
      detectionDate: '2026-10-16T12:00:00.000Z',
    })
    expect(flags[0].description).toContain('incomplete_training')
    expect(flags[0].suggestedAction).toBe('Please resolve the issue: incomplete training')
  })

  it('should skip risks that already have an unresolved flag for the same user', async () => {
    const user = buildUser({
      id: 42,
      isEnabledTwoFactor: false,
      isInUseSecurePassword: true,
      admin_policy_agreement: true,
      isCompletedTrainingAccessibility: true,
      isCompletedTrainingRisk: true,
    })
    routeFind(payload, {
      tenants: [tenant],
      users: [user],
      flags: [
        buildFlag({
          flagType: 'missing_2fa',
          affectedEntity: { relationTo: 'users', value: 42 },
        }),
      ],
    })

    const result = await findRisksAndCreateFlag()

    expect(result).toMatchObject({ summary: { totalFlagsCreated: 0 } })
    expect(createdFlags(payload)).toHaveLength(0)
  })

  it('should recognise existing flags whose affected user is populated as an object', async () => {
    const user = buildUser({
      id: 42,
      isEnabledTwoFactor: false,
      isInUseSecurePassword: true,
      admin_policy_agreement: true,
      isCompletedTrainingAccessibility: true,
      isCompletedTrainingRisk: true,
    })
    routeFind(payload, {
      tenants: [tenant],
      users: [user],
      flags: [
        buildFlag({
          flagType: 'missing_2fa',
          affectedEntity: { relationTo: 'users', value: user },
        }),
      ],
    })

    await findRisksAndCreateFlag()

    expect(createdFlags(payload)).toHaveLength(0)
  })

  it('should warn but keep going when some flags fail to be created', async () => {
    const user = buildUser({
      id: 42,
      isEnabledTwoFactor: false,
      isInUseSecurePassword: false,
      admin_policy_agreement: true,
      isCompletedTrainingAccessibility: true,
      isCompletedTrainingRisk: true,
    })
    routeFind(payload, { tenants: [tenant], users: [user] })
    payload.create.mockRejectedValueOnce(new Error('unique constraint'))

    const result = await findRisksAndCreateFlag()

    expect(result).toMatchObject({ success: true })
    expect(console.warn).toHaveBeenCalledWith(
      '[detectRisks] 1/2 flags failed to create for tenant 10',
    )
  })

  it('should create no flags when the users lookup for a tenant fails', async () => {
    routeFind(payload, { tenants: [tenant] }, ['users'])

    const result = await findRisksAndCreateFlag()

    expect(result).toMatchObject({ summary: { total: 1, totalFlagsCreated: 0 } })
    expect(createdFlags(payload)).toHaveLength(0)
  })

  it('should return a failed summary when the tenants lookup throws', async () => {
    routeFind(payload, {}, ['tenants'])

    const result = await findRisksAndCreateFlag()

    expect(result).toEqual({
      success: false,
      error: 'tenants query failed',
      summary: { total: 0, succeeded: 0, failed: 0, totalFlagsCreated: 0 },
    })
  })

  describe('auto-resolving flags for completed tasks', () => {
    const setupCompleted = (
      taskType: 'POLICY_ACKNOWLEDGMENT' | 'CONFIRM_2FA',
      tenantValue = 10,
    ) => {
      routeFind(payload, {
        tenants: [tenant],
        compliance_tasks: [
          buildComplianceTask({
            type: taskType,
            assignedUser: 42,
            status: 'COMPLETED',
            tenant: tenantValue,
          }),
        ],
        flags: [buildFlag({ id: 77, status: 'pending', flagType: 'unacknowledged_policies' })],
      })
    }

    it('should resolve open flags related to a task completed in the last 24 hours', async () => {
      setupCompleted('POLICY_ACKNOWLEDGMENT')

      await findRisksAndCreateFlag()

      const taskQuery = payload.find.mock.calls.find(
        ([arg]) => arg.collection === 'compliance_tasks',
      )?.[0]
      expect(JSON.stringify(taskQuery.where)).toContain('2026-10-15T12:00:00.000Z')
      expect(payload.update).toHaveBeenCalledWith({
        collection: 'flags',
        id: 77,
        data: { status: 'resolved', lastActivity: '2026-10-16T12:00:00.000Z' },
      })
      expect(payload.create).toHaveBeenCalledWith({
        collection: 'flagHistory',
        data: {
          flag: 77,
          user: 42,
          action: 'status_changed',
          prevStatus: 'pending',
          newStatus: 'resolved',
          tenant: 10,
        },
      })
    })

    it('should not touch flags for task types that have no related flag type', async () => {
      setupCompleted('CONFIRM_2FA')

      await findRisksAndCreateFlag()

      expect(payload.update).not.toHaveBeenCalled()
    })

    it('should keep the job successful when auto-resolving fails', async () => {
      routeFind(payload, { tenants: [tenant] }, ['compliance_tasks'])

      const result = await findRisksAndCreateFlag()

      expect(result).toMatchObject({ success: true })
      expect(console.error).toHaveBeenCalledWith(
        '[autoResolveCompletedTaskFlags] Error:',
        expect.any(Error),
      )
    })
  })
})

describe('detectRisksTask', () => {
  it('should be registered as the detectRisks job with retries and a typed output', () => {
    expect(detectRisksTask.slug).toBe('detectRisks')
    expect(detectRisksTask.retries).toBe(2)
    expect(detectRisksTask.outputSchema?.map((field) => 'name' in field && field.name)).toEqual([
      'success',
      'message',
    ])
  })
})
