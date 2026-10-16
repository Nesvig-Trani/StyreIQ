import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildComplianceTask, buildUser } from '@/shared/__tests__/fixtures'
import { buildTenant } from '../fixtures'
import type { Tenant } from '@/types/payload-types'
import { ComplianceTaskGenerator } from '../../services/compliance-task-generator'

type Where = { and?: Record<string, { equals?: string | number }>[] }
const typeOf = (where: Where) => where?.and?.find((c) => c.type)?.type?.equals

describe('ComplianceTaskGenerator', () => {
  let payload: ReturnType<typeof createFakePayload>
  const user = buildUser({
    id: 7,
    name: 'Mateo Salazar',
    email: 'mateo.salazar@universidad-andina.edu',
    tenant: 10,
    roles: ['social_media_manager'],
  })

  const stub = (options: {
    tenant?: Tenant
    existingTypes?: string[]
    sharedAccounts?: number
    policy?: { id: number; version: number } | null
    existingPolicyTask?: boolean
    existingTrainingTasks?: { relatedTraining: string }[]
  }) => {
    payload.find.mockImplementation(
      async ({ collection, where }: { collection: string; where: Where }) => {
        if (collection === 'social-medias') {
          const n = options.sharedAccounts ?? 0
          return { docs: Array(n).fill({ id: 1 }), totalDocs: n }
        }
        if (collection === 'policies') {
          const docs = options.policy ? [options.policy] : []
          return { docs, totalDocs: docs.length }
        }
        if (collection === 'compliance_tasks') {
          const type = typeOf(where)
          if (type === 'POLICY_ACKNOWLEDGMENT') {
            const n = options.existingPolicyTask ? 1 : 0
            return { docs: Array(n).fill({ id: 1 }), totalDocs: n }
          }
          if (type === 'TRAINING_COMPLETION') {
            const docs = (options.existingTrainingTasks ?? []).map((t) =>
              buildComplianceTask({
                type: 'TRAINING_COMPLETION',
                relatedTraining: t.relatedTraining,
              }),
            )
            return { docs, totalDocs: docs.length }
          }
          const has = options.existingTypes?.includes(String(type))
          return { docs: has ? [{ id: 1 }] : [], totalDocs: has ? 1 : 0 }
        }
        return { docs: [], totalDocs: 0 }
      },
    )
    payload.findByID.mockImplementation(async ({ collection }: { collection: string }) =>
      collection === 'tenants' ? (options.tenant ?? buildTenant()) : user,
    )
    let nextId = 500
    payload.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...data,
      id: nextId++,
    }))
  }

  const createdTypes = () => payload.create.mock.calls.map(([a]) => a.data.type)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T12:00:00.000Z'))
    payload = createFakePayload()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('generateTasksForNewUserExceptRollCall', () => {
    it('should reject a user without a tenant', async () => {
      stub({})
      const generator = new ComplianceTaskGenerator(payload.asPayload())

      await expect(
        generator.generateTasksForNewUserExceptRollCall(buildUser({ id: 3, tenant: null })),
      ).rejects.toThrow('User 3 has no tenant assigned')
    })

    it('should create password and 2FA tasks due in 30 days and email the user for each', async () => {
      stub({})
      const generator = new ComplianceTaskGenerator(payload.asPayload())

      await generator.generateTasksForNewUser(user)

      expect(createdTypes()).toEqual(['CONFIRM_USER_PASSWORD', 'CONFIRM_2FA'])
      expect(payload.create.mock.calls[0][0].data.dueDate).toBe('2026-11-15T12:00:00.000Z')
      expect(payload.sendEmail).toHaveBeenCalledTimes(2)
      expect(payload.sendEmail.mock.calls[0][0].subject).toContain('Confirm User Password Update')
    })

    it('should not duplicate tasks that are already pending', async () => {
      stub({ existingTypes: ['CONFIRM_USER_PASSWORD', 'CONFIRM_2FA'] })
      const generator = new ComplianceTaskGenerator(payload.asPayload())

      await generator.generateTasksForNewUserExceptRollCall(user)

      expect(payload.create).not.toHaveBeenCalled()
    })

    it('should create a shared password task when the user manages a shared account', async () => {
      stub({ sharedAccounts: 1 })
      const generator = new ComplianceTaskGenerator(payload.asPayload())

      await generator.generateTasksForNewUserExceptRollCall(user)

      expect(createdTypes()).toContain('CONFIRM_SHARED_PASSWORD')
    })

    it('should skip the shared password task when one is already pending', async () => {
      stub({ sharedAccounts: 1, existingTypes: ['CONFIRM_SHARED_PASSWORD'] })
      const generator = new ComplianceTaskGenerator(payload.asPayload())

      await generator.generateTasksForNewUserExceptRollCall(user)

      expect(createdTypes()).not.toContain('CONFIRM_SHARED_PASSWORD')
    })

    it('should create a policy acknowledgment task for the latest policy, due in 14 days', async () => {
      stub({ policy: { id: 40, version: 3 } })
      const generator = new ComplianceTaskGenerator(payload.asPayload())

      await generator.generateTasksForNewUserExceptRollCall(user)

      const policyTask = payload.create.mock.calls
        .map(([a]) => a.data)
        .find((d) => d.type === 'POLICY_ACKNOWLEDGMENT')
      expect(policyTask).toMatchObject({
        relatedPolicy: 40,
        description: 'Review and acknowledge policy version 3',
        dueDate: '2026-10-30T12:00:00.000Z',
      })
      const policyEmail = payload.sendEmail.mock.calls.find(([m]) =>
        m.subject.includes('Acknowledge Policy'),
      )
      expect(policyEmail?.[0].html).toContain('https://app.styreiq.test/dashboard')
    })

    it('should not duplicate the policy task for the same policy version', async () => {
      stub({ policy: { id: 40, version: 3 }, existingPolicyTask: true })
      const generator = new ComplianceTaskGenerator(payload.asPayload())

      await generator.generateTasksForNewUserExceptRollCall(user)

      expect(createdTypes()).not.toContain('POLICY_ACKNOWLEDGMENT')
    })

    it('should create training tasks for trainings assigned to the user role and send one combined email', async () => {
      const tenant = buildTenant({
        enabledTrainings: [
          { trainingId: 'training-governance', assignedRoles: ['social_media_manager'] },
          { trainingId: 'training-risk', assignedRoles: ['social_media_manager', 'unit_admin'] },
          { trainingId: 'training-leadership', assignedRoles: ['central_admin'] },
        ],
      })
      stub({ tenant })
      const generator = new ComplianceTaskGenerator(payload.asPayload())

      await generator.generateTasksForNewUserExceptRollCall(user)

      const trainingTasks = payload.create.mock.calls
        .map(([a]) => a.data)
        .filter((d) => d.type === 'TRAINING_COMPLETION')
      expect(trainingTasks.map((t) => t.relatedTraining)).toEqual([
        'training-governance',
        'training-risk',
      ])
      expect(trainingTasks[1].description).toBe('Complete: Social Media Risk Mitigation')
      expect(trainingTasks[0].dueDate).toBe('2026-11-30T12:00:00.000Z')
      const email = payload.sendEmail.mock.calls.find(([m]) =>
        m.subject.includes('2 Required Trainings'),
      )
      expect(email).toBeDefined()
    })

    it('should skip trainings the user already has a pending task for', async () => {
      const tenant = buildTenant({
        enabledTrainings: [
          { trainingId: 'training-governance', assignedRoles: ['social_media_manager'] },
          { trainingId: 'training-risk', assignedRoles: ['social_media_manager'] },
        ],
      })
      stub({
        tenant,
        existingTrainingTasks: [
          { relatedTraining: 'training-governance' },
          { relatedTraining: 'training-risk' },
        ],
      })
      const generator = new ComplianceTaskGenerator(payload.asPayload())

      await generator.generateTasksForNewUserExceptRollCall(user)

      expect(createdTypes()).not.toContain('TRAINING_COMPLETION')
    })

    it('should create no training tasks when the user has no roles', async () => {
      stub({
        tenant: buildTenant({
          enabledTrainings: [
            { trainingId: 'training-risk', assignedRoles: ['social_media_manager'] },
          ],
        }),
      })
      const generator = new ComplianceTaskGenerator(payload.asPayload())

      await generator.generateTasksForNewUserExceptRollCall(buildUser({ id: 7, roles: [] }))

      expect(createdTypes()).not.toContain('TRAINING_COMPLETION')
    })

    it('should keep the task and log when the notification email fails', async () => {
      stub({})
      payload.sendEmail.mockRejectedValue(new Error('Resend unavailable'))
      const generator = new ComplianceTaskGenerator(payload.asPayload())

      await generator.generateTasksForNewUserExceptRollCall(user)

      expect(createdTypes()).toEqual(['CONFIRM_USER_PASSWORD', 'CONFIRM_2FA'])
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('createUserPasswordTask failed to send email'),
        expect.any(Error),
      )
    })

    it('should schedule emails at the provided date', async () => {
      stub({})
      const generator = new ComplianceTaskGenerator(payload.asPayload(), {
        scheduledAt: '2026-10-16T12:02:00.000Z',
      })

      await generator.generateTasksForNewUserExceptRollCall(user)

      expect(payload.sendEmail.mock.calls[0][0].scheduledAt).toBe('2026-10-16T12:02:00.000Z')
    })
  })

  describe('generateRollCallTask', () => {
    it('should create a roll call due according to the tenant frequency', async () => {
      stub({ tenant: buildTenant({ governanceSettings: { rollCallFrequency: 'annual' } }) })
      const generator = new ComplianceTaskGenerator(payload.asPayload())

      await generator.generateRollCallTask(7)

      const data = payload.create.mock.calls[0][0].data
      expect(data.type).toBe('USER_ROLL_CALL')
      expect(data.dueDate).toBe('2027-10-16T12:00:00.000Z')
    })

    it('should default to a quarterly roll call', async () => {
      stub({})
      const generator = new ComplianceTaskGenerator(payload.asPayload())

      await generator.generateRollCallTask(7)

      expect(payload.create.mock.calls[0][0].data.dueDate).toBe('2027-01-14T12:00:00.000Z')
    })

    it('should reject when the user already has a pending roll call', async () => {
      stub({ existingTypes: ['USER_ROLL_CALL'] })
      const generator = new ComplianceTaskGenerator(payload.asPayload())

      await expect(generator.generateRollCallTask(7)).rejects.toThrow(
        'already has a pending Roll Call',
      )
    })

    it('should reject when the user does not exist', async () => {
      stub({})
      payload.findByID.mockResolvedValue(null)
      const generator = new ComplianceTaskGenerator(payload.asPayload())

      await expect(generator.generateRollCallTask(99)).rejects.toThrow('User 99 not found')
    })
  })
})
