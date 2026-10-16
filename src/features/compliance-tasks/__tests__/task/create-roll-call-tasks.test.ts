import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildComplianceTask, buildUser } from '@/shared/__tests__/fixtures'
import { buildTenant } from '../fixtures'
import type { Tenant } from '@/types/payload-types'

const fakePayload = vi.hoisted(() => ({
  current: null as ReturnType<typeof createFakePayload> | null,
}))

vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: fakePayload.current!.asPayload() }),
}))

import { createRollCallTasks } from '../../task/createRollCallTasks'

type Where = { and?: Record<string, { in?: string[]; equals?: string | number }>[] }
const isCompleted = (where: Where) => where.and?.some((c) => c.status?.equals === 'COMPLETED')

describe('createRollCallTasks', () => {
  let payload: ReturnType<typeof createFakePayload>
  const member = buildUser({ id: 7, email: 'mateo.salazar@universidad-andina.edu' })

  const stub = (options: { tenant?: Tenant; completedAt?: string; pending?: boolean }) => {
    payload.find.mockImplementation(
      async ({ collection, where }: { collection: string; where: Where }) => {
        if (collection === 'tenants')
          return { docs: [options.tenant ?? buildTenant()], totalDocs: 1 }
        if (collection === 'users') return { docs: [member], totalDocs: 1 }
        if (isCompleted(where)) {
          const docs = options.completedAt
            ? [
                buildComplianceTask({
                  type: 'USER_ROLL_CALL',
                  assignedUser: 7,
                  status: 'COMPLETED',
                  completedAt: options.completedAt,
                }),
              ]
            : []
          return { docs, totalDocs: docs.length }
        }
        const docs = options.pending
          ? [buildComplianceTask({ type: 'USER_ROLL_CALL', assignedUser: member })]
          : []
        return { docs, totalDocs: docs.length }
      },
    )
    payload.findByID.mockImplementation(async ({ collection }: { collection: string }) =>
      collection === 'users' ? member : buildTenant(),
    )
  }

  const auditActions = () =>
    payload.create.mock.calls
      .map(([a]) => a)
      .filter((a) => a.collection === 'audit_log')
      .map((a) => a.data.action)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T12:00:00.000Z'))
    payload = createFakePayload()
    fakePayload.current = payload
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should generate a roll call task when the last one was completed more than a quarter ago', async () => {
    stub({ completedAt: '2026-06-01T10:00:00.000Z' })

    await createRollCallTasks()

    const created = payload.create.mock.calls.map(([a]) => a)
    const task = created.find((a) => a.collection === 'compliance_tasks')
    expect(task?.data).toMatchObject({ type: 'USER_ROLL_CALL', assignedUser: 7, status: 'PENDING' })
    expect(auditActions()).toEqual(['roll_call_auto_generated'])
    expect(payload.sendEmail).toHaveBeenCalledTimes(1)
  })

  it('should respect the tenant frequency (monthly)', async () => {
    const tenant = buildTenant({ governanceSettings: { rollCallFrequency: 'monthly' } })
    stub({ tenant, completedAt: '2026-09-01T10:00:00.000Z' })

    await createRollCallTasks()

    expect(auditActions()).toEqual(['roll_call_auto_generated'])
  })

  it('should skip users with a recent completed roll call', async () => {
    stub({ completedAt: '2026-09-20T10:00:00.000Z' })

    await createRollCallTasks()

    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should skip users who have never completed a roll call', async () => {
    stub({})

    await createRollCallTasks()

    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should skip users who already have a pending roll call', async () => {
    stub({ completedAt: '2025-01-01T10:00:00.000Z', pending: true })

    await createRollCallTasks()

    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should record a failure audit entry when generation fails', async () => {
    stub({ completedAt: '2026-01-01T10:00:00.000Z' })
    payload.findByID.mockResolvedValue(null)

    await createRollCallTasks()

    const failure = payload.create.mock.calls
      .map(([a]) => a)
      .find((a) => a.data.action === 'roll_call_auto_generation_failed')
    expect(failure?.data.metadata.error).toBe('User 7 not found')
  })

  it('should log and continue when a tenant cannot be processed', async () => {
    payload.find.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === 'tenants') return { docs: [buildTenant()], totalDocs: 1 }
      throw new Error('db down')
    })

    await createRollCallTasks()

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to process roll call for tenant 10'),
      expect.any(Error),
    )
  })
})
