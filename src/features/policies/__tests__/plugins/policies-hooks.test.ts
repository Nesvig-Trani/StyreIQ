// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Acknowledgments, Policies } from '../../plugins/collections'
import {
  createFakeCollection,
  createFakePayload,
  createFakeRequest,
} from '@/shared/__tests__/payload-fakes'
import { buildComplianceTask, buildUser } from '@/shared/__tests__/fixtures'
import { buildTenant } from '@/features/tenants/__tests__/tenant-fixtures'

const centralAdmin = buildUser({
  id: 2,
  name: 'Camila Ospina',
  email: 'camila.ospina@universidad-andina.edu',
  roles: ['central_admin'],
  tenant: 10,
})

const emptyPage = { docs: [], totalDocs: 0 }

describe('Policies beforeValidate hook', () => {
  const hook = Policies.hooks?.beforeValidate?.[0]
  const collection = createFakeCollection('policies')

  const run = (
    user: ReturnType<typeof buildUser> | null,
    payload: ReturnType<typeof createFakePayload>,
    operation: 'create' | 'update',
    data: Record<string, unknown> = {},
  ) =>
    hook?.({
      collection,
      context: {},
      data,
      operation,
      req: createFakeRequest({ user, payload }).asRequest(),
    })

  it('should do nothing when there is no authenticated user', async () => {
    const payload = createFakePayload()
    expect(await run(null, payload, 'create')).toBeUndefined()
    expect(payload.find).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should leave updates untouched', async () => {
    const payload = createFakePayload()
    expect(await run(centralAdmin, payload, 'update', { version: 1.2 })).toBeUndefined()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should start at version 0.1 when the tenant has no previous policy', async () => {
    const payload = createFakePayload()
    const result = await run(centralAdmin, payload, 'create', { text: { root: {} } })
    expect(result).toEqual({ text: { root: {} }, version: 0.1, author: 2, tenant: 10 })
  })

  it('should bump the latest version by 0.1 without floating point drift', async () => {
    const payload = createFakePayload()
    payload.find.mockResolvedValue({ docs: [{ id: 5, version: 0.7 }], totalDocs: 1 })
    const result = await run(centralAdmin, payload, 'create')
    expect(result).toMatchObject({ version: 0.8 })
    expect(payload.find).toHaveBeenCalledWith({
      collection: 'policies',
      where: { tenant: { equals: 10 } },
      sort: '-version',
      limit: 1,
    })
  })

  it('should reset the policy review state of every user of the tenant', async () => {
    const payload = createFakePayload()
    await run(centralAdmin, payload, 'create')
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      where: { tenant: { equals: 10 } },
      data: {
        date_of_last_policy_review: expect.any(String),
        admin_policy_agreement: false,
      },
    })
  })

  it('should prefer the tenant sent in the data over the tenant of the user', async () => {
    const payload = createFakePayload()
    const superAdmin = buildUser({ id: 1, roles: ['super_admin'], tenant: null })
    const result = await run(superAdmin, payload, 'create', { tenant: 22 })
    expect(result).toMatchObject({ tenant: 22, author: 1 })
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenant: { equals: 22 } } }),
    )
  })

  it('should skip the user reset and search every policy when no tenant can be resolved', async () => {
    const payload = createFakePayload()
    const superAdmin = buildUser({ id: 1, roles: ['super_admin'], tenant: null })
    const result = await run(superAdmin, payload, 'create')
    expect(payload.update).not.toHaveBeenCalled()
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ where: {} }))
    expect(result).toMatchObject({ version: 0.1, tenant: null })
  })
})

describe('Policies afterChange hook (task fan-out)', () => {
  const hook = Policies.hooks?.afterChange?.[0]
  const collection = createFakeCollection('policies')
  const policy = { id: 7, version: 1.3, tenant: 10, author: 2 }
  const activeUsers = [
    buildUser({ id: 21, name: 'Mateo Giraldo', email: 'mateo.giraldo@universidad-andina.edu' }),
    buildUser({ id: 22, name: 'Sofía Herrera', email: 'sofia.herrera@universidad-andina.edu' }),
  ]

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-01T12:00:00.000Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const setup = (
    finder: (collection: string) => unknown = (slug) =>
      slug === 'users' ? { docs: activeUsers, totalDocs: 2 } : emptyPage,
  ) => {
    const payload = createFakePayload()
    payload.find.mockImplementation(async ({ collection: slug }: { collection: string }) =>
      finder(slug),
    )
    payload.create.mockImplementation(
      async ({ collection: slug, data }: { collection: string; data: Record<string, unknown> }) =>
        slug === 'compliance_tasks'
          ? buildComplianceTask({
              id: 900 + Number(data.assignedUser),
              assignedUser: Number(data.assignedUser),
            })
          : { id: 1 },
    )
    return payload
  }

  const trigger = async (
    payload: ReturnType<typeof createFakePayload>,
    operation: 'create' | 'update' = 'create',
    doc: Record<string, unknown> = policy,
    user: ReturnType<typeof buildUser> | null = centralAdmin,
  ) => {
    await hook?.({
      collection,
      context: {},
      doc,
      operation,
      previousDoc: {},
      req: createFakeRequest({ user, payload }).asRequest(),
    })
    await vi.advanceTimersByTimeAsync(1000)
  }

  const auditEntries = (payload: ReturnType<typeof createFakePayload>) =>
    payload.create.mock.calls
      .map(([args]) => args)
      .filter((args) => args.collection === 'audit_log')
      .map((args) => args.data)

  it('should not schedule anything when the policy is updated', async () => {
    const payload = setup()
    await trigger(payload, 'update')
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should wait one second before fanning out the tasks', async () => {
    const payload = setup()
    await hook?.({
      collection,
      context: {},
      doc: policy,
      operation: 'create',
      previousDoc: {},
      req: createFakeRequest({ user: centralAdmin, payload }).asRequest(),
    })
    expect(payload.find).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1000)
    expect(payload.find).toHaveBeenCalled()
  })

  it('should create a pending acknowledgment task due in 14 days for each active user', async () => {
    const payload = setup()
    await trigger(payload)

    const taskCalls = payload.create.mock.calls
      .map(([args]) => args)
      .filter((args) => args.collection === 'compliance_tasks')
    expect(taskCalls).toHaveLength(2)
    expect(taskCalls[0].data).toEqual({
      type: 'POLICY_ACKNOWLEDGMENT',
      assignedUser: 21,
      tenant: 10,
      status: 'PENDING',
      dueDate: '2026-10-15T12:00:01.000Z',
      description: 'Review and acknowledge policy version 1.3',
      relatedPolicy: 7,
      remindersSent: [],
      escalations: [],
    })
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        where: { and: [{ tenant: { equals: 10 } }, { status: { equals: 'active' } }] },
      }),
    )
  })

  it('should read the tenant id from a populated tenant relation', async () => {
    const payload = setup()
    await trigger(payload, 'create', { ...policy, tenant: { id: 10 } })
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'compliance_tasks',
        data: expect.objectContaining({ tenant: 10 }),
      }),
    )
  })

  it('should do nothing when the policy has no tenant', async () => {
    const payload = setup()
    await trigger(payload, 'create', { ...policy, tenant: undefined })
    expect(payload.find).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should do nothing when the tenant has no active users', async () => {
    const payload = setup(() => emptyPage)
    await trigger(payload)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should email each assignee and record an email_sent audit entry', async () => {
    const payload = setup()
    await trigger(payload)

    expect(payload.sendEmail).toHaveBeenCalledTimes(2)
    expect(payload.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'mateo.giraldo@universidad-andina.edu',
        subject: expect.stringContaining('New Action Required'),
      }),
    )
    const sent = auditEntries(payload).filter((entry) => entry.action === 'email_sent')
    expect(sent).toHaveLength(2)
    expect(sent[0]).toMatchObject({
      user: 21,
      entity: 'compliance_tasks',
      tenant: 10,
      metadata: {
        taskId: 921,
        taskType: 'POLICY_ACKNOWLEDGMENT',
        emailType: 'task_created',
        recipient: 'mateo.giraldo@universidad-andina.edu',
        success: true,
      },
    })
  })

  it('should skip users who already have an open acknowledgment task for the policy', async () => {
    const payload = setup((slug) => {
      if (slug === 'users') return { docs: activeUsers, totalDocs: 2 }
      return { docs: [buildComplianceTask()], totalDocs: 1 }
    })
    await trigger(payload)
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.sendEmail).not.toHaveBeenCalled()
  })

  it('should not send an email to users without an email address', async () => {
    const userWithoutEmail = buildUser({ id: 23, email: '' })
    const payload = setup((slug) =>
      slug === 'users' ? { docs: [userWithoutEmail], totalDocs: 1 } : emptyPage,
    )
    await trigger(payload)
    expect(payload.sendEmail).not.toHaveBeenCalled()
    expect(auditEntries(payload)).toEqual([])
  })

  it('should keep the task and log an email_failed audit entry when sending the email fails', async () => {
    const payload = setup()
    payload.sendEmail.mockRejectedValue(new Error('Resend rate limit exceeded'))
    await trigger(payload)

    const failed = auditEntries(payload).filter((entry) => entry.action === 'email_failed')
    expect(failed).toHaveLength(2)
    expect(failed[0]).toMatchObject({
      user: 21,
      metadata: {
        emailType: 'task_created',
        success: false,
        error: 'Resend rate limit exceeded',
      },
    })
    expect(auditEntries(payload).some((entry) => entry.action === 'task_creation_failed')).toBe(
      false,
    )
  })

  it('should stringify non Error email failures', async () => {
    const payload = setup()
    payload.sendEmail.mockRejectedValue('smtp offline')
    await trigger(payload)
    const failed = auditEntries(payload).find((entry) => entry.action === 'email_failed')
    expect(failed?.metadata).toMatchObject({ error: 'smtp offline' })
  })

  it('should audit a task_creation_failed entry listing the users whose task could not be created', async () => {
    const payload = setup()
    payload.create.mockImplementation(
      async ({ collection: slug, data }: { collection: string; data: Record<string, unknown> }) => {
        if (slug === 'compliance_tasks' && data.assignedUser === 22) {
          throw new Error('duplicate key value')
        }
        return buildComplianceTask({ id: 901 })
      },
    )
    await trigger(payload)

    const entry = auditEntries(payload).find((e) => e.action === 'task_creation_failed')
    expect(entry).toMatchObject({
      user: 2,
      entity: 'policies',
      tenant: 10,
      metadata: {
        policyId: 7,
        policyVersion: 1.3,
        totalUsers: 2,
        failedCount: 1,
        errors: ['duplicate key value'],
      },
    })
  })

  it('should attribute the failure audit to the policy author when there is no request user', async () => {
    const payload = setup()
    payload.create.mockImplementation(async ({ collection: slug }: { collection: string }) => {
      if (slug === 'compliance_tasks') throw new Error('db unavailable')
      return { id: 1 }
    })
    await trigger(payload, 'create', { ...policy, author: { id: 2 } }, null)
    const entry = auditEntries(payload).find((e) => e.action === 'task_creation_failed')
    expect(entry).toMatchObject({ user: 2 })
  })

  it('should record a critical_error audit entry when the users lookup fails', async () => {
    const payload = setup(() => emptyPage)
    payload.find.mockRejectedValue(new Error('connection reset'))
    await trigger(payload)
    expect(auditEntries(payload)).toEqual([
      {
        user: 2,
        action: 'critical_error',
        entity: 'policies',
        metadata: { policyId: 7, error: 'connection reset', context: 'policy_task_creation' },
        tenant: 10,
      },
    ])
  })
})

describe('Acknowledgments beforeValidate hook', () => {
  const hook = Acknowledgments.hooks?.beforeValidate?.[0]
  const collection = createFakeCollection('acknowledgments')
  const manager = buildUser({ id: 31, roles: ['social_media_manager'], tenant: 10 })

  it('should return the data untouched for anonymous requests', async () => {
    const payload = createFakePayload()
    const data = { policy: 7 }
    const result = await hook?.({
      collection,
      context: {},
      data,
      operation: 'create',
      req: createFakeRequest({ payload }).asRequest(),
    })
    expect(result).toBe(data)
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should return the data untouched on updates', async () => {
    const payload = createFakePayload()
    const data = { policy: 7 }
    const result = await hook?.({
      collection,
      context: {},
      data,
      operation: 'update',
      req: createFakeRequest({ user: manager, payload }).asRequest(),
    })
    expect(result).toBe(data)
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should stamp the acknowledging user and mark their policy agreement', async () => {
    const payload = createFakePayload()
    const result = await hook?.({
      collection,
      context: {},
      data: { policy: 7, user: 999 },
      operation: 'create',
      req: createFakeRequest({ user: manager, payload }).asRequest(),
    })
    expect(result).toEqual({ policy: 7, user: 31 })
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      where: { id: { equals: 31 } },
      data: {
        date_of_last_policy_review: expect.any(String),
        admin_policy_agreement: true,
      },
    })
  })
})

describe('Acknowledgments afterChange hook', () => {
  const hook = Acknowledgments.hooks?.afterChange?.[0]
  const collection = createFakeCollection('acknowledgments')
  const doc = { id: 3, policy: 7, user: 31 }
  const manager = buildUser({
    id: 31,
    roles: ['social_media_manager'],
    tenant: 10,
    organizations: [100],
  })

  const run = (
    payload: ReturnType<typeof createFakePayload>,
    user: ReturnType<typeof buildUser> | null = manager,
    operation: 'create' | 'update' = 'create',
  ) =>
    hook?.({
      collection,
      context: {},
      doc,
      operation,
      previousDoc: {},
      req: createFakeRequest({ user, payload }).asRequest(),
    })

  it('should do nothing on updates or without a user', async () => {
    const payload = createFakePayload()
    expect(await run(payload, manager, 'update')).toBeUndefined()
    expect(await run(payload, null)).toBeUndefined()
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should return the doc when the user has no pending policy tasks', async () => {
    const payload = createFakePayload()
    expect(await run(payload)).toBe(doc)
    expect(payload.find).toHaveBeenCalledWith({
      collection: 'compliance_tasks',
      where: {
        and: [
          { assignedUser: { equals: 31 } },
          { type: { equals: 'POLICY_ACKNOWLEDGMENT' } },
          { status: { in: ['PENDING', 'OVERDUE'] } },
        ],
      },
      limit: 0,
    })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should complete every pending or overdue task and audit each completion', async () => {
    const payload = createFakePayload()
    payload.find.mockResolvedValue({
      docs: [
        buildComplianceTask({ id: 41, assignedUser: 31 }),
        buildComplianceTask({ id: 42, assignedUser: 31, status: 'OVERDUE' }),
      ],
      totalDocs: 2,
    })
    expect(await run(payload)).toBe(doc)

    expect(payload.update).toHaveBeenCalledTimes(2)
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'compliance_tasks',
      id: 42,
      data: { status: 'COMPLETED', completedAt: expect.any(String) },
    })
    expect(payload.create).toHaveBeenCalledWith({
      collection: 'audit_log',
      data: {
        user: 31,
        action: 'task_completed',
        entity: 'compliance_tasks',
        metadata: {
          taskId: 41,
          taskType: 'POLICY_ACKNOWLEDGMENT',
          completedViaModal: true,
          policyId: 7,
          acknowledgedLatestVersion: true,
        },
        organizations: [100],
        tenant: 10,
      },
    })
  })

  it('should read the tenant from a populated tenant relation of the user', async () => {
    const payload = createFakePayload()
    payload.find.mockResolvedValue({ docs: [buildComplianceTask({ id: 41 })], totalDocs: 1 })
    const populated = buildUser({ id: 31, tenant: buildTenant({ id: 10 }) })
    await run(payload, populated)
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenant: 10 }) }),
    )
  })

  it('should log the error and still return the doc when completing tasks fails', async () => {
    const payload = createFakePayload()
    payload.find.mockRejectedValue(new Error('db down'))
    expect(await run(payload)).toBe(doc)
    expect(payload.logger.error).toHaveBeenCalledWith(
      'Error completing policy acknowledgment tasks:',
      expect.any(Error),
    )
  })
})
