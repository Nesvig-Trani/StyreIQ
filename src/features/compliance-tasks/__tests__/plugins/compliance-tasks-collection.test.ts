import { describe, expect, it } from 'vitest'
import type { PayloadRequest } from 'payload'
import { createFakePayload, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildComplianceTask, buildUser } from '@/shared/__tests__/fixtures'
import { ComplianceTasks } from '../../plugins/collections'
import { buildTenant } from '../fixtures'

const access = ComplianceTasks.access!
const conditionContext = { blockData: {}, path: [], user: null }

type ReadResult = boolean | Record<string, unknown>

const read = async (req: PayloadRequest): Promise<ReadResult> =>
  (await access.read!({ req })) as ReadResult

const canUpdate = async (req: PayloadRequest, id: string | number | undefined) =>
  access.update!({ req, id })

describe('ComplianceTasks collection', () => {
  it('should be registered under the compliance_tasks slug with all completion endpoints', () => {
    expect(ComplianceTasks.slug).toBe('compliance_tasks')
    expect(ComplianceTasks.endpoints).toHaveLength(10)
    expect(ComplianceTasks.timestamps).toBe(true)
  })

  it('should define the fields used by the compliance workflow', () => {
    const names = ComplianceTasks.fields.map((f) => ('name' in f ? f.name : undefined))

    expect(names).toEqual(
      expect.arrayContaining([
        'type',
        'assignedUser',
        'status',
        'dueDate',
        'completedAt',
        'relatedPolicy',
        'relatedTraining',
        'relatedFlag',
        'remindersSent',
        'escalations',
        'tenant',
      ]),
    )
  })

  it('should only show conditional relation fields for their task type', () => {
    const conditions = Object.fromEntries(
      ComplianceTasks.fields
        .filter((f) => f.type === 'relationship' || f.type === 'text')
        .map((f) => ['name' in f ? f.name : '', 'admin' in f ? f.admin?.condition : undefined]),
    )

    expect(
      conditions.relatedPolicy?.({ type: 'POLICY_ACKNOWLEDGMENT' }, {}, conditionContext),
    ).toBe(true)
    expect(conditions.relatedPolicy?.({ type: 'CONFIRM_2FA' }, {}, conditionContext)).toBe(false)
    expect(
      conditions.relatedTraining?.({ type: 'TRAINING_COMPLETION' }, {}, conditionContext),
    ).toBe(true)
    expect(conditions.relatedTraining?.({ type: 'CONFIRM_2FA' }, {}, conditionContext)).toBe(false)
    expect(conditions.relatedFlag?.({ type: 'REVIEW_FLAG' }, {}, conditionContext)).toBe(true)
    expect(conditions.relatedFlag?.({ type: 'USER_ROLL_CALL' }, {}, conditionContext)).toBe(false)
  })

  describe('read access', () => {
    it('should deny anonymous users', async () => {
      const { asRequest } = createFakeRequest({ user: null })

      expect(await read(asRequest())).toBe(false)
    })

    it('should allow a super admin to read everything', async () => {
      const { asRequest } = createFakeRequest({
        user: buildUser({ roles: ['super_admin'], tenant: null }),
      })

      expect(await read(asRequest())).toBe(true)
    })

    it('should deny a non super admin without a tenant', async () => {
      const { asRequest } = createFakeRequest({
        user: buildUser({ roles: ['central_admin'], tenant: null }),
      })

      expect(await read(asRequest())).toBe(false)
    })

    it('should limit a central admin to their tenant', async () => {
      const { asRequest } = createFakeRequest({
        user: buildUser({ roles: ['central_admin'], tenant: 10 }),
      })

      expect(await read(asRequest())).toEqual({ tenant: { equals: 10 } })
    })

    it('should limit a social media manager to their own tasks', async () => {
      const { asRequest } = createFakeRequest({
        user: buildUser({
          id: 7,
          roles: ['social_media_manager'],
          tenant: buildTenant({ id: 10 }),
        }),
      })

      expect(await read(asRequest())).toEqual({
        tenant: { equals: 10 },
        assignedUser: { equals: 7 },
      })
    })

    it('should limit a unit admin to tasks of users inside their units', async () => {
      const payload = createFakePayload()
      payload.find.mockImplementation(async ({ collection }: { collection: string }) =>
        collection === 'users'
          ? { docs: [{ id: 7 }, { id: 8 }], totalDocs: 2 }
          : { docs: [], totalDocs: 0 },
      )
      const { asRequest } = createFakeRequest({
        payload,
        user: buildUser({ id: 20, roles: ['unit_admin'], tenant: 10, organizations: [100] }),
      })

      expect(await read(asRequest())).toEqual({
        tenant: { equals: 10 },
        assignedUser: { in: [7, 8] },
      })
      expect(payload.find).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'users',
          where: { organizations: { in: [100] }, tenant: { equals: 10 } },
        }),
      )
    })
  })

  describe('update access', () => {
    it('should deny anonymous users and requests without an id', async () => {
      expect(await canUpdate(createFakeRequest({ user: null }).asRequest(), 42)).toBe(false)
      expect(await canUpdate(createFakeRequest({ user: buildUser() }).asRequest(), undefined)).toBe(
        false,
      )
    })

    it('should allow a super admin without loading the task', async () => {
      const payload = createFakePayload()
      const { asRequest } = createFakeRequest({
        payload,
        user: buildUser({ roles: ['super_admin'], tenant: null }),
      })

      expect(await canUpdate(asRequest(), 42)).toBe(true)
      expect(payload.findByID).not.toHaveBeenCalled()
    })

    it('should deny users without a tenant', async () => {
      const { asRequest } = createFakeRequest({ user: buildUser({ tenant: null }) })

      expect(await canUpdate(asRequest(), 42)).toBe(false)
    })

    it('should deny when the task cannot be found', async () => {
      const { asRequest } = createFakeRequest({ user: buildUser({ tenant: 10 }) })

      expect(await canUpdate(asRequest(), 42)).toBe(false)
    })

    it('should deny when loading the task fails', async () => {
      const payload = createFakePayload()
      payload.findByID.mockRejectedValue(new Error('db down'))
      const { asRequest } = createFakeRequest({ payload, user: buildUser({ tenant: 10 }) })

      expect(await canUpdate(asRequest(), 42)).toBe(false)
    })

    it('should let a central admin update tasks of their own tenant only', async () => {
      const payload = createFakePayload()
      const user = buildUser({ roles: ['central_admin'], tenant: 10 })
      payload.findByID.mockResolvedValueOnce(buildComplianceTask({ tenant: 10 }))
      expect(await canUpdate(createFakeRequest({ payload, user }).asRequest(), 42)).toBe(true)

      payload.findByID.mockResolvedValueOnce(buildComplianceTask({ tenant: 11 }))
      expect(await canUpdate(createFakeRequest({ payload, user }).asRequest(), 42)).toBe(false)
    })

    it('should let a social media manager update only the tasks assigned to them', async () => {
      const payload = createFakePayload()
      const user = buildUser({ id: 7, roles: ['social_media_manager'], tenant: 10 })
      payload.findByID.mockResolvedValueOnce(buildComplianceTask({ assignedUser: 7 }))
      expect(await canUpdate(createFakeRequest({ payload, user }).asRequest(), 42)).toBe(true)

      payload.findByID.mockResolvedValueOnce(buildComplianceTask({ assignedUser: 8 }))
      expect(await canUpdate(createFakeRequest({ payload, user }).asRequest(), 42)).toBe(false)
    })
  })

  describe('create and delete access', () => {
    it('should deny deleting for anyone but a super admin', async () => {
      const central = createFakeRequest({ user: buildUser({ roles: ['central_admin'] }) })
      const superAdmin = createFakeRequest({ user: buildUser({ roles: ['super_admin'] }) })
      const anonymous = createFakeRequest({ user: null })

      expect(await access.delete!({ req: central.asRequest() })).toBe(false)
      expect(await access.delete!({ req: superAdmin.asRequest() })).toBe(true)
      expect(await access.delete!({ req: anonymous.asRequest() })).toBe(false)
    })

    it('should deny creating for anonymous users', async () => {
      const { asRequest } = createFakeRequest({ user: null })

      expect(await access.create!({ req: asRequest() })).toBe(false)
    })
  })
})
