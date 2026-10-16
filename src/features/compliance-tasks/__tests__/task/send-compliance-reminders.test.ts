import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildComplianceTask, buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import { buildTenant } from '../fixtures'
import type { ComplianceTask, Organization, User } from '@/types/payload-types'

const fakePayload = vi.hoisted(() => ({
  current: null as ReturnType<typeof createFakePayload> | null,
}))

vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: fakePayload.current!.asPayload() }),
}))

import { sendComplianceReminders } from '../../task/sendComplianceReminders'

// "Today" is 2026-10-16 (local); due dates are expressed in local time to match calcDaysFromToday.
const dueIn = (days: number) => {
  const d = new Date(2026, 9, 16 + days, 12, 0, 0)
  return d.toISOString()
}

type World = {
  tenant?: ReturnType<typeof buildTenant>
  tasks?: ComplianceTask[]
  users?: User[]
  organizations?: Organization[]
  flags?: { id: number; description?: string }[]
  centralAdmins?: User[]
}

const setupWorld = (payload: ReturnType<typeof createFakePayload>, world: World) => {
  const tenant = world.tenant ?? buildTenant()
  const users = world.users ?? []
  const organizations = world.organizations ?? []
  payload.find.mockImplementation(async ({ collection }: { collection: string }) => {
    const docs =
      collection === 'tenants'
        ? [tenant]
        : collection === 'compliance_tasks'
          ? (world.tasks ?? [])
          : collection === 'flags'
            ? (world.flags ?? [])
            : collection === 'users'
              ? (world.centralAdmins ?? [])
              : []
    return { docs, totalDocs: docs.length }
  })
  payload.findByID.mockImplementation(
    async ({ collection, id }: { collection: string; id: number }) => {
      if (collection === 'users') return users.find((u) => u.id === id) ?? null
      if (collection === 'organization') return organizations.find((o) => o.id === id) ?? null
      return null
    },
  )
  return tenant
}

const run = async () => {
  const promise = sendComplianceReminders()
  await vi.runAllTimersAsync()
  await promise
}

const auditActions = (payload: ReturnType<typeof createFakePayload>) =>
  payload.create.mock.calls
    .map(([args]) => args)
    .filter((args) => args.collection === 'audit_log')
    .map((args) => args.data.action)

describe('sendComplianceReminders', () => {
  let payload: ReturnType<typeof createFakePayload>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 16, 9, 0, 0))
    payload = createFakePayload()
    fakePayload.current = payload
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const assignee = buildUser({
    id: 7,
    name: 'Mateo Salazar',
    email: 'mateo.salazar@universidad-andina.edu',
  })

  describe('reminders before the due date', () => {
    it('should email the assignee and record the reminder when the task is due on a scheduled day', async () => {
      const task = buildComplianceTask({
        id: 50,
        type: 'POLICY_ACKNOWLEDGMENT',
        assignedUser: 7,
        dueDate: dueIn(3),
      })
      setupWorld(payload, { tasks: [task], users: [assignee] })

      await run()

      expect(payload.sendEmail).toHaveBeenCalledTimes(1)
      const email = payload.sendEmail.mock.calls[0][0]
      expect(email.to).toBe('mateo.salazar@universidad-andina.edu')
      expect(email.subject).toContain('Reminder: Policy Acknowledgment Due')
      expect(email.html).toContain('Hello Mateo Salazar')
      expect(email.html).toContain('https://app.styreiq.test/dashboard/compliance')
      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'compliance_tasks',
          id: 50,
          data: { remindersSent: [expect.objectContaining({ daysSinceDue: 3 })] },
        }),
      )
      expect(auditActions(payload)).toEqual(['reminder_sent'])
    })

    it('should not email again when a reminder was already sent for that day', async () => {
      const task = buildComplianceTask({
        assignedUser: assignee,
        dueDate: dueIn(7),
        remindersSent: [{ sentAt: '2026-10-09T10:00:00.000Z', daysSinceDue: 7 }],
      })
      setupWorld(payload, { tasks: [task], users: [assignee] })

      await run()

      expect(payload.sendEmail).not.toHaveBeenCalled()
      expect(payload.update).not.toHaveBeenCalled()
    })

    it('should not email when the days until due are not part of the tenant schedule', async () => {
      const task = buildComplianceTask({ assignedUser: 7, dueDate: dueIn(5) })
      setupWorld(payload, { tasks: [task], users: [assignee] })

      await run()

      expect(payload.sendEmail).not.toHaveBeenCalled()
    })

    it('should use the tenant custom reminder schedule', async () => {
      const task = buildComplianceTask({ assignedUser: 7, dueDate: dueIn(5) })
      const tenant = buildTenant({ governanceSettings: { reminderSchedule: [{ day: 5 }] } })
      setupWorld(payload, { tenant, tasks: [task], users: [assignee] })

      await run()

      expect(payload.sendEmail).toHaveBeenCalledTimes(1)
    })

    it('should fall back to "User" when the assignee has no name', async () => {
      const unnamed = buildUser({
        id: 8,
        name: undefined,
        email: 'sin.nombre@universidad-andina.edu',
      })
      const task = buildComplianceTask({ assignedUser: 8, dueDate: dueIn(14) })
      setupWorld(payload, { tasks: [task], users: [unnamed] })

      await run()

      expect(payload.sendEmail.mock.calls[0][0].html).toContain('Hello User,')
    })

    it('should log an email_failed audit entry and not record the reminder when sending fails', async () => {
      const task = buildComplianceTask({ id: 51, assignedUser: 7, dueDate: dueIn(3) })
      setupWorld(payload, { tasks: [task], users: [assignee] })
      payload.sendEmail.mockRejectedValueOnce(new Error('Resend rate limit'))

      await run()

      expect(payload.update).not.toHaveBeenCalled()
      const failure = payload.create.mock.calls[0][0]
      expect(failure.collection).toBe('audit_log')
      expect(failure.data.metadata).toMatchObject({ taskId: 51, error: 'Resend rate limit' })
      expect(auditActions(payload)).toHaveLength(1)
    })

    it('should skip the task when the assigned user has no email', async () => {
      const noEmail = buildUser({ id: 9, email: '' })
      const task = buildComplianceTask({ assignedUser: 9, dueDate: dueIn(3) })
      setupWorld(payload, { tasks: [task], users: [noEmail] })

      await run()

      expect(payload.sendEmail).not.toHaveBeenCalled()
    })
  })

  describe('escalations after the due date', () => {
    it('should send an overdue notice and mark the task OVERDUE at the first escalation level', async () => {
      const task = buildComplianceTask({
        id: 60,
        type: 'TRAINING_COMPLETION',
        assignedUser: 7,
        dueDate: dueIn(-3),
      })
      setupWorld(payload, { tasks: [task], users: [assignee] })

      await run()

      expect(payload.sendEmail.mock.calls[0][0].subject).toBe('Overdue: Training Completion')
      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 60,
          data: expect.objectContaining({
            status: 'OVERDUE',
            escalations: [expect.objectContaining({ escalatedTo: 7 })],
          }),
        }),
      )
      expect(auditActions(payload)).toEqual(['overdue_notice_sent'])
    })

    it('should log an email failure when the overdue notice cannot be sent', async () => {
      const task = buildComplianceTask({ assignedUser: 7, dueDate: dueIn(-3) })
      setupWorld(payload, { tasks: [task], users: [assignee] })
      payload.sendEmail.mockRejectedValueOnce('smtp down')

      await run()

      expect(payload.update).not.toHaveBeenCalled()
      expect(payload.create.mock.calls[0][0].data.metadata.error).toBe('smtp down')
    })

    it('should not repeat the escalation when one was already recorded on that day', async () => {
      const task = buildComplianceTask({
        assignedUser: 7,
        dueDate: dueIn(-3),
        escalations: [{ escalatedAt: dueIn(0), escalatedTo: 7, reason: 'Overdue notice' }],
      })
      setupWorld(payload, { tasks: [task], users: [assignee] })

      await run()

      expect(payload.sendEmail).not.toHaveBeenCalled()
    })

    describe('level 2 (unit admin)', () => {
      const unitAdmin = buildUser({
        id: 20,
        name: 'Laura Mejía',
        email: 'laura.mejia@universidad-andina.edu',
        roles: ['unit_admin'],
      })
      const unit = buildOrganization({ id: 100, admin: 20 })
      const memberOfUnit = buildUser({
        id: 7,
        name: 'Mateo Salazar',
        email: 'mateo.salazar@universidad-andina.edu',
        organizations: [100],
      })

      it('should email the unit admin, escalate and create a risk flag for a security task', async () => {
        const task = buildComplianceTask({
          id: 61,
          type: 'CONFIRM_2FA',
          assignedUser: 7,
          dueDate: dueIn(-7),
        })
        setupWorld(payload, {
          tasks: [task],
          users: [memberOfUnit, unitAdmin],
          organizations: [unit],
        })

        await run()

        const email = payload.sendEmail.mock.calls[0][0]
        expect(email.to).toBe('laura.mejia@universidad-andina.edu')
        expect(email.html).toContain('Mateo Salazar')
        const flagCreate = payload.create.mock.calls
          .map(([a]) => a)
          .find((a) => a.collection === 'flags')
        expect(flagCreate?.data).toMatchObject({
          flagType: 'OVERDUE_SECURITY_TASK',
          assignedTo: 7,
          organizations: [100],
          source: 'automated',
        })
        expect(auditActions(payload)).toEqual(['escalated_to_unit_admin'])
      })

      it('should append to the existing open flag instead of creating a new one', async () => {
        const task = buildComplianceTask({
          id: 62,
          type: 'POLICY_ACKNOWLEDGMENT',
          assignedUser: 7,
          dueDate: dueIn(-7),
        })
        setupWorld(payload, {
          tasks: [task],
          users: [memberOfUnit, unitAdmin],
          organizations: [unit],
          flags: [{ id: 300, description: 'Initial detection' }],
        })

        await run()

        expect(payload.update).toHaveBeenCalledWith(
          expect.objectContaining({
            collection: 'flags',
            id: 300,
            data: expect.objectContaining({
              description: expect.stringContaining('[Update] Task escalated after 7 days overdue.'),
            }),
          }),
        )
        expect(payload.create.mock.calls.some(([a]) => a.collection === 'flags')).toBe(false)
      })

      it('should create an OVERDUE_COMPLIANCE_TASK flag for non-security tasks', async () => {
        const task = buildComplianceTask({
          type: 'USER_ROLL_CALL',
          assignedUser: 7,
          dueDate: dueIn(-7),
        })
        setupWorld(payload, {
          tasks: [task],
          users: [memberOfUnit, unitAdmin],
          organizations: [unit],
        })

        await run()

        const flag = payload.create.mock.calls.map(([a]) => a).find((a) => a.collection === 'flags')
        expect(flag?.data.flagType).toBe('OVERDUE_COMPLIANCE_TASK')
        expect(flag?.data.description).toContain('7 days overdue')
      })

      it('should skip the risk flag when the assignee belongs to no organization', async () => {
        const central = buildUser({
          id: 30,
          name: 'Camila Ortega',
          email: 'camila.ortega@universidad-andina.edu',
          roles: ['central_admin'],
        })
        const orphan = buildUser({
          id: 7,
          email: 'mateo.salazar@universidad-andina.edu',
          organizations: [],
        })
        const task = buildComplianceTask({ assignedUser: 7, dueDate: dueIn(-7) })
        setupWorld(payload, { tasks: [task], users: [orphan], centralAdmins: [central] })

        await run()

        expect(payload.sendEmail.mock.calls[0][0].to).toBe('camila.ortega@universidad-andina.edu')
        expect(payload.create.mock.calls.some(([a]) => a.collection === 'flags')).toBe(false)
        expect(auditActions(payload)).toEqual(['escalated_to_unit_admin'])
      })

      it('should route to the central admin when the assignee is themselves a unit admin', async () => {
        const central = buildUser({
          id: 30,
          name: 'Camila Ortega',
          email: 'camila.ortega@universidad-andina.edu',
          roles: ['central_admin'],
        })
        const selfAdmin = buildUser({
          id: 7,
          email: 'mateo.salazar@universidad-andina.edu',
          roles: ['unit_admin'],
          organizations: [100],
        })
        const task = buildComplianceTask({ assignedUser: 7, dueDate: dueIn(-7) })
        setupWorld(payload, {
          tasks: [task],
          users: [selfAdmin],
          organizations: [unit],
          centralAdmins: [central],
        })

        await run()

        expect(payload.sendEmail.mock.calls[0][0].to).toBe('camila.ortega@universidad-andina.edu')
      })

      it('should fall back to the central admin when the unit has no admin', async () => {
        const central = buildUser({
          id: 30,
          email: 'camila.ortega@universidad-andina.edu',
          roles: ['central_admin'],
        })
        const task = buildComplianceTask({ assignedUser: 7, dueDate: dueIn(-7) })
        setupWorld(payload, {
          tasks: [task],
          users: [memberOfUnit],
          organizations: [buildOrganization({ id: 100, admin: null })],
          centralAdmins: [central],
        })

        await run()

        expect(payload.sendEmail.mock.calls[0][0].to).toBe('camila.ortega@universidad-andina.edu')
      })

      it('should skip the escalation when no admin can be found', async () => {
        const task = buildComplianceTask({ assignedUser: 7, dueDate: dueIn(-7) })
        setupWorld(payload, {
          tasks: [task],
          users: [memberOfUnit],
          organizations: [buildOrganization({ id: 100, admin: null })],
        })

        await run()

        expect(payload.sendEmail).not.toHaveBeenCalled()
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('No unit admin found'))
      })

      it('should log an email failure when the unit admin email cannot be sent', async () => {
        const task = buildComplianceTask({ assignedUser: 7, dueDate: dueIn(-7) })
        setupWorld(payload, {
          tasks: [task],
          users: [memberOfUnit, unitAdmin],
          organizations: [unit],
        })
        payload.sendEmail.mockRejectedValueOnce(new Error('bounced'))

        await run()

        expect(auditActions(payload)).toEqual(['email_failed'])
        expect(payload.create.mock.calls[0][0].data.metadata.escalatedTo).toBe(20)
      })
    })

    describe('level 3 (central admin)', () => {
      const central = buildUser({
        id: 30,
        name: 'Camila Ortega',
        email: 'camila.ortega@universidad-andina.edu',
        roles: ['central_admin'],
      })
      const member = buildUser({
        id: 7,
        name: 'Mateo Salazar',
        email: 'mateo.salazar@universidad-andina.edu',
        organizations: [buildOrganization({ id: 100 })],
      })

      it('should email the central admin with the unit name and mark the task ESCALATED', async () => {
        const task = buildComplianceTask({ id: 70, assignedUser: 7, dueDate: dueIn(-14) })
        setupWorld(payload, {
          tasks: [task],
          users: [member],
          organizations: [buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' })],
          centralAdmins: [central],
        })

        await run()

        const email = payload.sendEmail.mock.calls[0][0]
        expect(email.to).toBe('camila.ortega@universidad-andina.edu')
        expect(email.html).toContain('Dirección de Comunicaciones')
        expect(payload.update).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 70,
            data: expect.objectContaining({ status: 'ESCALATED' }),
          }),
        )
        expect(auditActions(payload)).toEqual(['escalated_to_central_admin'])
      })

      it('should skip when the tenant has no central admin', async () => {
        const task = buildComplianceTask({ assignedUser: 7, dueDate: dueIn(-14) })
        setupWorld(payload, { tasks: [task], users: [member] })

        await run()

        expect(payload.sendEmail).not.toHaveBeenCalled()
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('No central admin found'))
      })

      it('should log an email failure when the central admin email fails', async () => {
        const task = buildComplianceTask({ assignedUser: 7, dueDate: dueIn(-14) })
        setupWorld(payload, { tasks: [task], users: [member], centralAdmins: [central] })
        payload.sendEmail.mockRejectedValueOnce(new Error('mailbox full'))

        await run()

        expect(auditActions(payload)).toEqual(['email_failed'])
      })
    })

    it('should do nothing for an overdue task whose age does not match an escalation level', async () => {
      const task = buildComplianceTask({ assignedUser: 7, dueDate: dueIn(-5) })
      setupWorld(payload, { tasks: [task], users: [assignee] })

      await run()

      expect(payload.sendEmail).not.toHaveBeenCalled()
    })
  })

  describe('error isolation', () => {
    it('should keep processing other tasks when one task throws', async () => {
      const broken = buildComplianceTask({ id: 80, assignedUser: 404, dueDate: dueIn(3) })
      const healthy = buildComplianceTask({ id: 81, assignedUser: 7, dueDate: dueIn(3) })
      setupWorld(payload, { tasks: [broken, healthy], users: [assignee] })
      const original = payload.findByID.getMockImplementation()!
      payload.findByID.mockImplementation(async (args: { collection: string; id: number }) => {
        if (args.id === 404) throw new Error('db timeout')
        return original(args)
      })

      await run()

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process task 80'),
        expect.any(Error),
      )
      expect(payload.sendEmail).toHaveBeenCalledTimes(1)
    })

    it('should keep processing other tenants when one tenant fails', async () => {
      const tenant = buildTenant()
      payload.find.mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'tenants')
          return { docs: [tenant, buildTenant({ id: 11 })], totalDocs: 2 }
        throw new Error('connection reset')
      })

      await run()

      expect(console.error).toHaveBeenCalledTimes(2)
    })
  })
})
