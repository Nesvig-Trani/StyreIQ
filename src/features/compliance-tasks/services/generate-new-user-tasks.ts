import { Payload } from 'payload'
import { User } from '@/types/payload-types'
import { ComplianceTaskGenerator } from './compliance-task-generator'

export const SKIP_COMPLIANCE_TASK_GENERATION = 'skipComplianceTaskGeneration'

// Resend does not deliver emails in send order, so the task emails are scheduled this long
// after the welcome email to make sure the welcome email always arrives first (GIQ-83).
const TASK_EMAILS_DELAY_AFTER_WELCOME_MS = 2 * 60 * 1000

export const getTaskEmailsScheduleAfterWelcome = (): string =>
  new Date(Date.now() + TASK_EMAILS_DELAY_AFTER_WELCOME_MS).toISOString()

type GenerateNewUserComplianceTasksArgs = {
  payload: Payload
  user: User
  actorId?: number
  taskEmailsScheduledAt?: string
}

// Awaited directly instead of setTimeout so task generation completes within the
// serverless function lifecycle (Vercel suspends the function after the response
// is sent, causing deferred callbacks to never execute — GIQ-81).
export const generateNewUserComplianceTasks = async ({
  payload,
  user,
  actorId,
  taskEmailsScheduledAt,
}: GenerateNewUserComplianceTasksArgs): Promise<void> => {
  try {
    const generator = new ComplianceTaskGenerator(payload, { scheduledAt: taskEmailsScheduledAt })
    await generator.generateTasksForNewUserExceptRollCall(user)

    await payload.create({
      collection: 'audit_log',
      data: {
        user: actorId || user.id,
        action: 'compliance_task_generated',
        entity: 'users',
        metadata: {
          userId: user.id,
          tasksGenerated: [
            'CONFIRM_USER_PASSWORD',
            'CONFIRM_2FA',
            'CONFIRM_SHARED_PASSWORD',
            'POLICY_ACKNOWLEDGMENT',
            'TRAINING_COMPLETION',
          ],
        },
        tenant: user.tenant,
      },
    })
  } catch (error) {
    console.error('Error generating compliance tasks:', error)
  }
}
