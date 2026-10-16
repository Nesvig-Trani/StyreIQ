import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PayloadRequest } from 'payload'
import { createFakePayload, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildComplianceTask, buildUser } from '@/shared/__tests__/fixtures'
import {
  completeFlagResolutionEndpoint,
  completePasswordSetupEndpoint,
  completeRollCallEndpoint,
  completeSharedPasswordEndpoint,
  completeTaskEndpoint,
  completeTrainingEndpoint,
  completeTwoFactorEndpoint,
  completeUserPasswordEndpoint,
  generateRollCallEndpoint,
  getRollCallStatusEndpoint,
} from '../../plugins/endpoints'
import { EndpointError } from '@/shared'

const callHandler = async (
  endpoint: { handler: (req: PayloadRequest) => Promise<Response> | Response },
  req: PayloadRequest,
) => endpoint.handler(req)

const rejection = async (promise: Promise<unknown>) => {
  try {
    await promise
  } catch (error) {
    return error
  }
  throw new Error('Expected the handler to reject')
}

describe('compliance task endpoints', () => {
  const assignee = buildUser({
    id: 7,
    name: 'Mateo Salazar',
    email: 'mateo.salazar@universidad-andina.edu',
    tenant: 10,
    organizations: [100],
  })

  let payload: ReturnType<typeof createFakePayload>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T12:00:00.000Z'))
    payload = createFakePayload()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const request = (options: { user?: typeof assignee | null; body?: unknown; taskId?: string }) =>
    createFakeRequest({
      payload,
      user: options.user === undefined ? assignee : options.user,
      body: options.body,
      routeParams: options.taskId ? { id: options.taskId } : {},
    })

  const stubTask = (overrides: Parameters<typeof buildComplianceTask>[0] = {}) => {
    const task = buildComplianceTask({ id: 42, assignedUser: 7, ...overrides })
    payload.findByID.mockResolvedValue(task)
    payload.update.mockResolvedValue({ ...task, status: 'COMPLETED' })
    return task
  }

  const auditCall = () =>
    payload.create.mock.calls.map(([a]) => a).find((a) => a.collection === 'audit_log')

  describe('shared validation (via completeTaskEndpoint)', () => {
    it('should return 400 when the JSON body is missing', async () => {
      const { asRequest } = request({ taskId: '42' })

      const error = await rejection(callHandler(completeTaskEndpoint, asRequest()))

      expect(error).toBeInstanceOf(EndpointError)
      expect(error).toMatchObject({ code: 400, message: 'Missing JSON body' })
    })

    it('should return 400 when the task id is missing', async () => {
      const { asRequest } = request({ body: {} })

      const error = await rejection(callHandler(completeTaskEndpoint, asRequest()))

      expect(error).toMatchObject({ code: 400, message: 'Task ID required' })
    })

    it('should return 401 when the user is not signed in', async () => {
      const { asRequest } = request({ user: null, body: {}, taskId: '42' })

      const error = await rejection(callHandler(completeTaskEndpoint, asRequest()))

      expect(error).toMatchObject({ code: 401 })
      expect(payload.update).not.toHaveBeenCalled()
    })

    it('should return 403 when the task belongs to another user', async () => {
      stubTask({ assignedUser: 99 })
      const { asRequest } = request({ body: {}, taskId: '42' })

      const error = await rejection(callHandler(completeTaskEndpoint, asRequest()))

      expect(error).toMatchObject({ code: 403, message: 'Not authorized to complete this task' })
      expect(payload.update).not.toHaveBeenCalled()
    })

    it('should accept a populated assignedUser object when it matches the signed-in user', async () => {
      stubTask({ assignedUser: assignee })
      const { asRequest } = request({ body: {}, taskId: '42' })

      const response = await callHandler(completeTaskEndpoint, asRequest())

      expect(response.status).toBe(200)
    })

    it('should return 500 when an unexpected error happens', async () => {
      payload.findByID.mockRejectedValue(new Error('connection lost'))
      const { asRequest } = request({ body: {}, taskId: '42' })

      const error = await rejection(callHandler(completeTaskEndpoint, asRequest()))

      expect(error).toMatchObject({ code: 500, message: 'Failed to complete task' })
    })

    it('should return 400 when the user has no tenant to record the audit log against', async () => {
      stubTask()
      const { asRequest } = request({
        user: buildUser({ id: 7, tenant: null }),
        body: {},
        taskId: '42',
      })

      const error = await rejection(callHandler(completeTaskEndpoint, asRequest()))

      expect(error).toMatchObject({ code: 400, message: 'User has no tenant assigned' })
    })
  })

  describe('completeTaskEndpoint', () => {
    it('should complete the task, return it and audit the completion with the notes', async () => {
      stubTask({ type: 'POLICY_ACKNOWLEDGMENT' })
      const { asRequest } = request({ body: { notes: 'Leí y acepto la política' }, taskId: '42' })

      const response = await callHandler(completeTaskEndpoint, asRequest())

      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({ success: true, task: { status: 'COMPLETED' } })
      expect(payload.update).toHaveBeenCalledWith({
        collection: 'compliance_tasks',
        id: 42,
        data: { status: 'COMPLETED', completedAt: '2026-10-16T12:00:00.000Z' },
      })
      expect(auditCall()?.data).toMatchObject({
        user: 7,
        action: 'task_completed',
        tenant: 10,
        organizations: [100],
        metadata: expect.objectContaining({ notes: 'Leí y acepto la política' }),
      })
    })

    it('should default the audit notes when none are provided', async () => {
      stubTask()
      const { asRequest } = request({ body: {}, taskId: '42' })

      await callHandler(completeTaskEndpoint, asRequest())

      expect(auditCall()?.data.metadata.notes).toBe('No additional notes')
    })
  })

  describe('specific completion endpoints', () => {
    it('should mark password and 2FA as confirmed on the user when completing password setup', async () => {
      stubTask({ type: 'PASSWORD_SETUP' })
      const { asRequest } = request({ taskId: '42' })

      const response = await callHandler(completePasswordSetupEndpoint, asRequest())

      expect(response.status).toBe(200)
      expect(payload.update).toHaveBeenCalledWith({
        collection: 'users',
        id: 7,
        data: {
          isInUseSecurePassword: true,
          isEnabledTwoFactor: true,
          passwordUpdatedAt: '2026-10-16T12:00:00.000Z',
        },
      })
      expect(auditCall()?.data.action).toBe('password_setup_completed')
    })

    it('should record the password update date when confirming the user password', async () => {
      stubTask({ type: 'CONFIRM_USER_PASSWORD' })
      const { asRequest } = request({ taskId: '42' })

      await callHandler(completeUserPasswordEndpoint, asRequest())

      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'users',
          data: { isInUseSecurePassword: true, passwordUpdatedAt: '2026-10-16T12:00:00.000Z' },
        }),
      )
      expect(auditCall()?.data.action).toBe('user_password_confirmed')
    })

    it('should only audit when confirming the shared password', async () => {
      stubTask({ type: 'CONFIRM_SHARED_PASSWORD' })
      const { asRequest } = request({ taskId: '42' })

      await callHandler(completeSharedPasswordEndpoint, asRequest())

      expect(payload.update).toHaveBeenCalledTimes(1)
      expect(auditCall()?.data.action).toBe('shared_password_confirmed')
    })

    it('should enable two factor on the user when confirming 2FA', async () => {
      stubTask({ type: 'CONFIRM_2FA' })
      const { asRequest } = request({ taskId: '42' })

      await callHandler(completeTwoFactorEndpoint, asRequest())

      expect(payload.update).toHaveBeenCalledWith({
        collection: 'users',
        id: 7,
        data: { isEnabledTwoFactor: true },
      })
      expect(auditCall()?.data.action).toBe('2fa_confirmed')
    })

    it('should mark the matching training as completed on the user', async () => {
      stubTask({ type: 'TRAINING_COMPLETION', relatedTraining: 'training-risk' })
      const { asRequest } = request({ taskId: '42' })

      await callHandler(completeTrainingEndpoint, asRequest())

      expect(payload.update).toHaveBeenCalledWith({
        collection: 'users',
        id: 7,
        data: {
          date_of_last_training: '2026-10-16T12:00:00.000Z',
          isCompletedTrainingRisk: true,
        },
      })
      expect(auditCall()?.data.metadata).toMatchObject({
        trainingId: 'training-risk',
        userFieldsUpdated: ['isCompletedTrainingRisk'],
      })
    })

    it('should only update the last training date for an unknown training', async () => {
      stubTask({ type: 'TRAINING_COMPLETION', relatedTraining: 'training-brand' })
      const { asRequest } = request({ taskId: '42' })

      await callHandler(completeTrainingEndpoint, asRequest())

      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'users',
          data: { date_of_last_training: '2026-10-16T12:00:00.000Z' },
        }),
      )
    })

    it('should audit the roll call completion', async () => {
      stubTask({ type: 'USER_ROLL_CALL' })
      const { asRequest } = request({ taskId: '42' })

      const response = await callHandler(completeRollCallEndpoint, asRequest())

      expect(response.status).toBe(200)
      expect(auditCall()?.data.action).toBe('roll_call_completed')
    })

    it.each([
      [completePasswordSetupEndpoint, 'Failed to complete password setup'],
      [completeUserPasswordEndpoint, 'Failed to complete user password confirmation'],
      [completeSharedPasswordEndpoint, 'Failed to complete shared password confirmation'],
      [completeTwoFactorEndpoint, 'Failed to complete 2FA confirmation'],
      [completeTrainingEndpoint, 'Failed to complete training'],
      [completeRollCallEndpoint, 'Failed to complete roll call'],
    ])(
      'should return a 500 with a specific message when the update fails (%#)',
      async (endpoint, message) => {
        stubTask()
        payload.update.mockRejectedValue(new Error('write failed'))
        const { asRequest } = request({ taskId: '42' })

        const error = await rejection(callHandler(endpoint, asRequest()))

        expect(error).toMatchObject({ code: 500, message })
      },
    )

    it.each([
      completePasswordSetupEndpoint,
      completeUserPasswordEndpoint,
      completeSharedPasswordEndpoint,
      completeTwoFactorEndpoint,
      completeTrainingEndpoint,
      completeRollCallEndpoint,
    ])('should return 403 when the task is assigned to someone else (%#)', async (endpoint) => {
      stubTask({ assignedUser: 99 })
      const { asRequest } = request({ taskId: '42' })

      const error = await rejection(callHandler(endpoint, asRequest()))

      expect(error).toMatchObject({ code: 403 })
    })
  })

  describe('completeFlagResolutionEndpoint', () => {
    it('should resolve the related flag, complete the task and audit the summary', async () => {
      stubTask({ type: 'REVIEW_FLAG', relatedFlag: 300 })
      const { asRequest } = request({
        body: { resolutionSummary: 'Se restableció el acceso y se rotó la contraseña' },
        taskId: '42',
      })

      const response = await callHandler(completeFlagResolutionEndpoint, asRequest())

      expect(response.status).toBe(200)
      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'flags',
          id: 300,
          data: expect.objectContaining({ status: 'resolved' }),
        }),
      )
      expect(auditCall()?.data.metadata).toMatchObject({
        flagId: 300,
        resolutionSummary: 'Se restableció el acceso y se rotó la contraseña',
      })
    })

    it('should accept a populated related flag object', async () => {
      stubTask({
        type: 'REVIEW_FLAG',
        relatedFlag: { id: 301, status: 'pending', createdAt: '', updatedAt: '' },
      })
      const { asRequest } = request({ body: {}, taskId: '42' })

      await callHandler(completeFlagResolutionEndpoint, asRequest())

      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'flags', id: 301 }),
      )
    })

    it('should return 400 when the task has no related flag', async () => {
      stubTask({ type: 'REVIEW_FLAG', relatedFlag: null })
      const { asRequest } = request({ body: {}, taskId: '42' })

      const error = await rejection(callHandler(completeFlagResolutionEndpoint, asRequest()))

      expect(error).toMatchObject({ code: 400, message: 'Task has no related flag' })
    })

    it('should return 400 when the JSON body is missing', async () => {
      const { asRequest } = request({ taskId: '42' })

      const error = await rejection(callHandler(completeFlagResolutionEndpoint, asRequest()))

      expect(error).toMatchObject({ code: 400, message: 'Missing JSON body' })
    })

    it('should return 500 when resolving fails unexpectedly', async () => {
      stubTask({ relatedFlag: 300 })
      payload.update.mockRejectedValue(new Error('write failed'))
      const { asRequest } = request({ body: {}, taskId: '42' })

      const error = await rejection(callHandler(completeFlagResolutionEndpoint, asRequest()))

      expect(error).toMatchObject({ code: 500, message: 'Failed to complete flag resolution' })
    })
  })

  describe('generateRollCallEndpoint', () => {
    const centralAdmin = buildUser({ id: 30, roles: ['central_admin'], tenant: 10 })
    const superAdmin = buildUser({ id: 1, roles: ['super_admin'], tenant: null })

    const stubGeneration = () => {
      payload.findByID.mockImplementation(async ({ collection }: { collection: string }) =>
        collection === 'users' ? assignee : { id: 10, governanceSettings: {} },
      )
      payload.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 77,
        dueDate: '2027-01-14T12:00:00.000Z',
        ...data,
      }))
    }

    it('should return 401 without a signed in user', async () => {
      const { asRequest } = request({ user: null, body: { userId: 7, tenantId: 10 } })

      const error = await rejection(callHandler(generateRollCallEndpoint, asRequest()))

      expect(error).toMatchObject({ code: 401 })
    })

    it('should return 403 when a social media manager tries to generate a roll call', async () => {
      const { asRequest } = request({ body: { userId: 7, tenantId: 10 } })

      const error = await rejection(callHandler(generateRollCallEndpoint, asRequest()))

      expect(error).toMatchObject({
        code: 403,
        message: 'Only Central Admin or Super Admin can generate Roll Call',
      })
    })

    it('should return 400 when the body is missing or incomplete', async () => {
      const noBody = request({ user: centralAdmin })
      expect(
        await rejection(callHandler(generateRollCallEndpoint, noBody.asRequest())),
      ).toMatchObject({
        code: 400,
        message: 'Missing JSON body',
      })

      const incomplete = request({ user: centralAdmin, body: { userId: 7 } })
      expect(
        await rejection(callHandler(generateRollCallEndpoint, incomplete.asRequest())),
      ).toMatchObject({ code: 400, message: 'userId and tenantId are required' })
    })

    it('should return 403 when a central admin targets another tenant', async () => {
      const { asRequest } = request({ user: centralAdmin, body: { userId: 7, tenantId: 11 } })

      const error = await rejection(callHandler(generateRollCallEndpoint, asRequest()))

      expect(error).toMatchObject({
        code: 403,
        message: 'Cannot generate Roll Call for other tenants',
      })
    })

    it('should return 404 when the target user does not exist', async () => {
      payload.findByID.mockResolvedValue(null)
      const { asRequest } = request({ user: centralAdmin, body: { userId: 7, tenantId: 10 } })

      const error = await rejection(callHandler(generateRollCallEndpoint, asRequest()))

      expect(error).toMatchObject({ code: 404, message: 'User not found' })
    })

    it('should return 403 when the target user belongs to a different tenant', async () => {
      payload.findByID.mockResolvedValue(buildUser({ id: 7, tenant: 55 }))
      const { asRequest } = request({ user: centralAdmin, body: { userId: 7, tenantId: 10 } })

      const error = await rejection(callHandler(generateRollCallEndpoint, asRequest()))

      expect(error).toMatchObject({ code: 403, message: 'User does not belong to this tenant' })
    })

    it('should create the roll call task and audit the manual generation for a central admin', async () => {
      stubGeneration()
      const { asRequest } = request({ user: centralAdmin, body: { userId: 7, tenantId: 10 } })

      const response = await callHandler(generateRollCallEndpoint, asRequest())

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({
        success: true,
        message: 'Roll Call task created successfully for user 7',
        userId: 7,
      })
      expect(payload.create.mock.calls.some(([a]) => a.data.type === 'USER_ROLL_CALL')).toBe(true)
      expect(auditCall()?.data).toMatchObject({
        action: 'roll_call_manually_generated',
        metadata: expect.objectContaining({
          triggeredBy: 30,
          targetUserId: 7,
          method: 'admin_manual',
        }),
      })
    })

    it('should let a super admin generate a roll call for any tenant', async () => {
      stubGeneration()
      const { asRequest } = request({ user: superAdmin, body: { userId: 7, tenantId: 10 } })

      const response = await callHandler(generateRollCallEndpoint, asRequest())

      expect(response.status).toBe(200)
    })

    it('should wrap generator failures in a 500 including the reason', async () => {
      payload.findByID.mockResolvedValue(assignee)
      payload.find.mockResolvedValue({ docs: [{ id: 1 }], totalDocs: 1 })
      const { asRequest } = request({ user: centralAdmin, body: { userId: 7, tenantId: 10 } })

      const error = await rejection(callHandler(generateRollCallEndpoint, asRequest()))

      expect(error).toMatchObject({
        code: 500,
        message: 'Failed to generate Roll Call: User 7 already has a pending Roll Call task',
      })
    })
  })

  describe('getRollCallStatusEndpoint', () => {
    it('should return 401 without a signed in user', async () => {
      const { asRequest } = request({ user: null, body: { userIds: [7] } })

      expect(await rejection(callHandler(getRollCallStatusEndpoint, asRequest()))).toMatchObject({
        code: 401,
      })
    })

    it('should return 400 without a JSON body', async () => {
      const { asRequest } = request({})

      expect(await rejection(callHandler(getRollCallStatusEndpoint, asRequest()))).toMatchObject({
        code: 400,
        message: 'Missing JSON body',
      })
    })

    it.each([[{}], [{ userIds: [] }], [{ userIds: 'abc' }]])(
      'should return 400 when userIds is invalid (%j)',
      async (body) => {
        const { asRequest } = request({ body })

        expect(await rejection(callHandler(getRollCallStatusEndpoint, asRequest()))).toMatchObject({
          code: 400,
          message: 'userIds array is required',
        })
      },
    )

    it('should report pending state and days since the last completion per user', async () => {
      payload.find.mockImplementation(
        async ({
          where,
        }: {
          where: { and: { assignedUser?: { equals: number }; status?: { equals?: string } }[] }
        }) => {
          const userId = where.and[0].assignedUser!.equals
          const completedQuery = where.and[2].status?.equals === 'COMPLETED'
          if (userId === 7 && completedQuery) {
            return { docs: [{ completedAt: '2026-10-06T12:00:00.000Z' }], totalDocs: 1 }
          }
          if (userId === 8 && !completedQuery) return { docs: [{ id: 5 }], totalDocs: 1 }
          return { docs: [], totalDocs: 0 }
        },
      )
      const { asRequest } = request({ body: { userIds: [7, 8] } })

      const response = await callHandler(getRollCallStatusEndpoint, asRequest())

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({
        '7': { hasPending: false, lastCompletedDays: 10 },
        '8': { hasPending: true, lastCompletedDays: null },
      })
    })

    it('should return 500 when the lookup fails', async () => {
      payload.find.mockRejectedValue(new Error('db down'))
      const { asRequest } = request({ body: { userIds: [7] } })

      expect(await rejection(callHandler(getRollCallStatusEndpoint, asRequest()))).toMatchObject({
        code: 500,
        message: 'Failed to get Roll Call status: db down',
      })
    })
  })
})
