// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildUser } from '@/shared/__tests__/fixtures'
import {
  createFakeCollection,
  createFakePayload,
  createFakeRequest,
  type FakePayload,
} from '@/shared/__tests__/payload-fakes'

// Task generation has its own tests; here only the hook's decision to call it matters.
const generateNewUserComplianceTasks = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
vi.mock('@/features/compliance-tasks/services/generate-new-user-tasks', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/features/compliance-tasks/services/generate-new-user-tasks')
  >()),
  generateNewUserComplianceTasks,
}))

import { SKIP_COMPLIANCE_TASK_GENERATION } from '@/features/compliance-tasks/services/generate-new-user-tasks'
import { Users } from '../../plugins/collections'

const [afterChange] = Users.hooks?.afterChange ?? []
const [beforeChange] = Users.hooks?.beforeChange ?? []
if (!afterChange || !beforeChange) throw new Error('Users collection must define both hooks')

const collection = createFakeCollection('users')

let payload: FakePayload
beforeEach(() => {
  payload = createFakePayload()
  generateNewUserComplianceTasks.mockClear()
})
afterEach(() => vi.useRealTimers())

describe('Users beforeChange hook', () => {
  const run = (args: {
    data: Record<string, unknown>
    operation: 'create' | 'update'
    originalDoc?: Record<string, unknown>
  }) =>
    beforeChange({
      collection,
      context: {},
      req: createFakeRequest({
        user: buildUser({ roles: ['central_admin'] }),
        payload,
      }).asRequest(),
      ...args,
    })

  it('should refuse to move a user to another tenant after creation', async () => {
    await expect(
      run({ operation: 'update', data: { tenant: 20 }, originalDoc: { tenant: 10 } }),
    ).rejects.toThrow('Cannot change tenant assignment after user creation')
  })

  it('should allow an update that resends the same tenant', async () => {
    await expect(
      run({ operation: 'update', data: { tenant: 10 }, originalDoc: { tenant: 10 } }),
    ).resolves.toEqual({ tenant: 10 })
  })

  it('should reject role combinations that are not allowed', async () => {
    await expect(
      run({ operation: 'create', data: { roles: ['super_admin', 'unit_admin'] } }),
    ).rejects.toThrow('Role assignment error: SuperAdmin cannot be combined with other roles')
  })

  it('should set the active role to the highest role on creation', async () => {
    const data = await run({
      operation: 'create',
      data: { roles: ['social_media_manager', 'unit_admin'] },
    })
    expect(data).toMatchObject({ active_role: 'unit_admin' })
  })

  it('should keep an explicit active role that the user still holds', async () => {
    const data = await run({
      operation: 'update',
      data: { roles: ['unit_admin', 'social_media_manager'], active_role: 'social_media_manager' },
      originalDoc: { active_role: 'unit_admin' },
    })
    expect(data).toMatchObject({ active_role: 'social_media_manager' })
  })

  it('should reset the active role when the role it pointed to is removed', async () => {
    const data = await run({
      operation: 'update',
      data: { roles: ['social_media_manager'] },
      originalDoc: { active_role: 'unit_admin' },
    })
    expect(data).toMatchObject({ active_role: 'social_media_manager' })
  })

  describe('central admin Primary Unit inheritance', () => {
    const newCentralAdmin = {
      roles: ['central_admin'],
      tenant: 10,
      organizations: [101],
    }

    it('should add the tenant primary unit to a new central admin', async () => {
      payload.findByID.mockResolvedValue({ id: 10, primaryUnit: { id: 500 } })
      const data = await run({ operation: 'create', data: { ...newCentralAdmin } })
      expect(payload.findByID).toHaveBeenCalledWith({ collection: 'tenants', id: 10 })
      expect(data).toMatchObject({ organizations: [101, 500] })
    })

    it('should accept a primary unit that is only an id and not duplicate it', async () => {
      payload.findByID.mockResolvedValue({ id: 10, primaryUnit: 101 })
      const data = await run({ operation: 'create', data: { ...newCentralAdmin } })
      expect(data).toMatchObject({ organizations: [101] })
    })

    it('should leave organizations alone when the tenant has no primary unit', async () => {
      payload.findByID.mockResolvedValue({ id: 10, primaryUnit: null })
      const data = await run({ operation: 'create', data: { ...newCentralAdmin } })
      expect(data).toMatchObject({ organizations: [101] })
    })

    it('should log and continue when the tenant cannot be loaded', async () => {
      payload.findByID.mockRejectedValue(new Error('database unavailable'))
      const data = await run({ operation: 'create', data: { ...newCentralAdmin } })
      expect(payload.logger.error).toHaveBeenCalledWith('Failed to inherit Primary Unit', {
        error: expect.any(Error),
      })
      expect(data).toMatchObject({ organizations: [101] })
    })

    it('should not touch the tenant for non central admins', async () => {
      await run({
        operation: 'create',
        data: { roles: ['unit_admin'], tenant: 10, organizations: [101] },
      })
      expect(payload.findByID).not.toHaveBeenCalled()
    })
  })
})

describe('Users afterChange hook', () => {
  const newUser = buildUser({ id: 31, name: 'Isabela Torres', roles: ['unit_admin'], tenant: 10 })

  const run = (args: {
    doc: ReturnType<typeof buildUser>
    operation: 'create' | 'update'
    previousDoc?: ReturnType<typeof buildUser>
  }) =>
    afterChange({
      collection,
      context: {},
      previousDoc: undefined,
      req: createFakeRequest({
        user: buildUser({ id: 2, roles: ['central_admin'] }),
        payload,
      }).asRequest(),
      ...args,
    })

  it('should generate the onboarding tasks for a newly created user', async () => {
    await run({ doc: newUser, operation: 'create' })
    expect(generateNewUserComplianceTasks).toHaveBeenCalledWith({
      payload: expect.anything(),
      user: newUser,
      actorId: 2,
    })
  })

  it('should skip task generation when the create endpoint flagged it (GIQ-83)', async () => {
    await afterChange({
      collection,
      context: {},
      doc: newUser,
      previousDoc: undefined,
      operation: 'create',
      req: createFakeRequest({
        user: buildUser({ id: 2 }),
        payload,
        context: { [SKIP_COMPLIANCE_TASK_GENERATION]: true },
      }).asRequest(),
    })
    expect(generateNewUserComplianceTasks).not.toHaveBeenCalled()
  })

  describe('training tasks for newly added roles', () => {
    const before = buildUser({ id: 31, roles: ['social_media_manager'], tenant: 10 })
    const after = buildUser({ id: 31, roles: ['social_media_manager', 'unit_admin'], tenant: 10 })
    const governanceTraining = { trainingId: 'training-governance', assignedRoles: ['unit_admin'] }

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-10-16T12:00:00Z'))
    })

    it('should do nothing when no role was added', async () => {
      await run({ doc: before, previousDoc: before, operation: 'update' })
      expect(payload.findByID).not.toHaveBeenCalled()
    })

    it('should create the trainings assigned to the new role, due in 45 days, and audit it', async () => {
      payload.findByID.mockResolvedValue({
        id: 10,
        enabledTrainings: [
          governanceTraining,
          { trainingId: 'training-risk', assignedRoles: ['central_admin'] },
        ],
      })
      await run({ doc: after, previousDoc: before, operation: 'update' })

      expect(payload.create).toHaveBeenCalledTimes(2)
      expect(payload.create).toHaveBeenNthCalledWith(1, {
        collection: 'compliance_tasks',
        data: expect.objectContaining({
          type: 'TRAINING_COMPLETION',
          assignedUser: 31,
          tenant: 10,
          status: 'PENDING',
          dueDate: '2026-11-30T12:00:00.000Z',
          relatedTraining: 'training-governance',
          description:
            'Complete: Social Media Governance Essentials: Accessibility, Compliance & Risk',
        }),
      })
      expect(payload.create).toHaveBeenNthCalledWith(2, {
        collection: 'audit_log',
        data: expect.objectContaining({
          user: 2,
          entity: 'users',
          tenant: 10,
          metadata: {
            userId: 31,
            addedRoles: ['unit_admin'],
            trainingsCreated: ['training-governance'],
          },
        }),
      })
    })

    it('should not duplicate a training the user already has pending', async () => {
      payload.findByID.mockResolvedValue({ id: 10, enabledTrainings: [governanceTraining] })
      payload.find.mockResolvedValue({
        docs: [{ id: 9, relatedTraining: 'training-governance' }],
        totalDocs: 1,
      })
      await run({ doc: after, previousDoc: before, operation: 'update' })
      expect(payload.create).not.toHaveBeenCalled()
    })

    it('should do nothing when the tenant has no training for the new role', async () => {
      payload.findByID.mockResolvedValue({
        id: 10,
        enabledTrainings: [{ trainingId: 'training-risk', assignedRoles: ['central_admin'] }],
      })
      await run({ doc: after, previousDoc: before, operation: 'update' })
      expect(payload.find).not.toHaveBeenCalled()
      expect(payload.create).not.toHaveBeenCalled()
    })

    it('should log instead of generating trainings for a user whose tenant is null', async () => {
      // Documents a latent bug: `typeof null === 'object'`, so the hook reads `null.id`, throws,
      // and the surrounding try/catch logs it. No tasks are created either way.
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      await run({ doc: { ...after, tenant: null }, previousDoc: before, operation: 'update' })
      expect(payload.findByID).not.toHaveBeenCalled()
      expect(payload.create).not.toHaveBeenCalled()
      expect(consoleError).toHaveBeenCalledOnce()
      consoleError.mockRestore()
    })

    it('should log and carry on when generating the trainings fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      payload.findByID.mockRejectedValue(new Error('database unavailable'))
      await expect(
        run({ doc: after, previousDoc: before, operation: 'update' }),
      ).resolves.not.toThrow()
      expect(consoleError).toHaveBeenCalledWith(
        'Error generating training tasks for new roles:',
        expect.any(Error),
      )
      consoleError.mockRestore()
    })
  })
})
