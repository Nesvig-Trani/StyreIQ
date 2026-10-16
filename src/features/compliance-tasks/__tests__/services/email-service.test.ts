import { beforeEach, describe, expect, it } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildComplianceTask, buildUser } from '@/shared/__tests__/fixtures'
import { ComplianceEmailService } from '../../services/email-service'

describe('ComplianceEmailService', () => {
  let payload: ReturnType<typeof createFakePayload>
  const user = buildUser({
    id: 7,
    name: 'Mateo Salazar',
    email: 'mateo.salazar@universidad-andina.edu',
  })
  const supervisor = buildUser({
    id: 20,
    name: 'Laura Mejía',
    email: 'laura.mejia@universidad-andina.edu',
  })

  beforeEach(() => {
    payload = createFakePayload()
  })

  const sentEmail = () => payload.sendEmail.mock.calls[0][0]

  describe('sendTaskCreatedEmail', () => {
    it.each([
      ['CONFIRM_USER_PASSWORD', 'Confirm User Password Update', 'user-password'],
      ['CONFIRM_SHARED_PASSWORD', 'Confirm Shared Account Password Update', 'shared-password'],
      ['CONFIRM_2FA', 'Confirm Two-Factor Authentication (2FA)', '2fa'],
      ['TRAINING_COMPLETION', 'Complete Required Training', 'training'],
      ['USER_ROLL_CALL', 'Confirm Account Access (Roll Call)', 'roll-call'],
    ] as const)('should link %s tasks to their own task page', async (type, title, route) => {
      const service = new ComplianceEmailService(payload.asPayload())

      await service.sendTaskCreatedEmail(buildComplianceTask({ id: 42, type }), user)

      expect(sentEmail().to).toBe('mateo.salazar@universidad-andina.edu')
      expect(sentEmail().subject).toBe(`New Action Required: ${title}`)
      expect(sentEmail().html).toContain(
        `https://app.styreiq.test/dashboard/compliance/${route}/42`,
      )
    })

    it('should link policy tasks to the dashboard', async () => {
      const service = new ComplianceEmailService(payload.asPayload())

      await service.sendTaskCreatedEmail(
        buildComplianceTask({ id: 42, type: 'POLICY_ACKNOWLEDGMENT' }),
        user,
      )

      expect(sentEmail().html).toContain('https://app.styreiq.test/dashboard"')
      expect(sentEmail().html).not.toContain('/dashboard/compliance/policy/42')
    })

    it('should use generic copy for task types without a dedicated title', async () => {
      const service = new ComplianceEmailService(payload.asPayload())

      await service.sendTaskCreatedEmail(buildComplianceTask({ type: 'REVIEW_FLAG' }), user)

      expect(sentEmail().subject).toBe('New Action Required: Complete Action')
      expect(sentEmail().html).toContain('/dashboard/compliance/task/')
    })

    it('should pass the scheduled delivery date through to the email', async () => {
      const service = new ComplianceEmailService(payload.asPayload(), {
        scheduledAt: '2026-10-16T12:02:00.000Z',
      })

      await service.sendTaskCreatedEmail(buildComplianceTask(), user)

      expect(sentEmail().scheduledAt).toBe('2026-10-16T12:02:00.000Z')
    })
  })

  describe('sendMultipleTrainingsEmail', () => {
    it('should use the singular subject for a single training', async () => {
      const service = new ComplianceEmailService(payload.asPayload())

      await service.sendMultipleTrainingsEmail(
        [
          buildComplianceTask({
            type: 'TRAINING_COMPLETION',
            description: 'Complete: Social Media Risk Mitigation',
            dueDate: '2026-12-01T12:00:00.000Z',
          }),
        ],
        user,
      )

      expect(sentEmail().subject).toBe('Action Required: Complete 1 Required Training')
      expect(sentEmail().html).toContain('Social Media Risk Mitigation')
      expect(sentEmail().html).toContain('December 1, 2026')
    })

    it('should use the plural subject and list every training', async () => {
      const service = new ComplianceEmailService(payload.asPayload())

      await service.sendMultipleTrainingsEmail(
        [
          buildComplianceTask({ id: 1, description: 'Complete: Governance Essentials' }),
          buildComplianceTask({ id: 2, description: 'Complete: Crisis Management' }),
        ],
        user,
      )

      expect(sentEmail().subject).toBe('Action Required: Complete 2 Required Trainings')
      expect(sentEmail().html).toContain('Governance Essentials')
      expect(sentEmail().html).toContain('Crisis Management')
    })
  })

  describe('sendFlagCreatorNotification', () => {
    it('should notify the flag creator about who was assigned', async () => {
      const service = new ComplianceEmailService(payload.asPayload())

      await service.sendFlagCreatorNotification(
        buildComplianceTask({ type: 'REVIEW_FLAG' }),
        supervisor,
        user,
      )

      expect(sentEmail().to).toBe('laura.mejia@universidad-andina.edu')
      expect(sentEmail().subject).toBe('Risk Flag Assigned: Review Risk Flag')
      expect(sentEmail().html).toContain('Mateo Salazar')
    })
  })

  describe('sendReminderEmail', () => {
    it('should send an upcoming reminder when the task is not overdue', async () => {
      const service = new ComplianceEmailService(payload.asPayload())

      await service.sendReminderEmail(buildComplianceTask({ type: 'CONFIRM_2FA' }), user)

      expect(sentEmail().subject).toBe(
        'Reminder: Compliance Task Due Soon - Confirm Two-Factor Authentication (2FA)',
      )
      expect(sentEmail().html).toContain('Due Date:')
    })

    it.each([
      [1, 'Overdue by 1 day'],
      [5, 'Overdue by 5 days'],
    ])('should flag the task as overdue by %i days', async (days, text) => {
      const service = new ComplianceEmailService(payload.asPayload())

      await service.sendReminderEmail(buildComplianceTask(), user, days)

      expect(sentEmail().subject).toContain('OVERDUE: Compliance Task')
      expect(sentEmail().html).toContain(text)
    })

    it('should treat zero overdue days as an upcoming reminder', async () => {
      const service = new ComplianceEmailService(payload.asPayload())

      await service.sendReminderEmail(buildComplianceTask(), user, 0)

      expect(sentEmail().subject).toContain('Due Soon')
    })
  })

  describe('sendTaskReminderEmail', () => {
    it('should state the days remaining and link to the task', async () => {
      const service = new ComplianceEmailService(payload.asPayload())

      await service.sendTaskReminderEmail(
        buildComplianceTask({ id: 9, type: 'TRAINING_COMPLETION' }),
        user,
        3,
      )

      expect(sentEmail().subject).toBe('Reminder: Complete Required Training - Due in 3 days')
      expect(sentEmail().html).toContain('/dashboard/compliance/training/9')
    })
  })

  describe('sendTaskEscalationEmail', () => {
    it('should email the supervisor naming the assignee', async () => {
      const service = new ComplianceEmailService(payload.asPayload())

      await service.sendTaskEscalationEmail(
        buildComplianceTask({ id: 9, type: 'USER_ROLL_CALL' }),
        user,
        supervisor,
      )

      expect(sentEmail().to).toBe('laura.mejia@universidad-andina.edu')
      expect(sentEmail().subject).toBe(
        '[ESCALATION] Overdue Action: Mateo Salazar - Confirm Account Access (Roll Call)',
      )
    })
  })
})
