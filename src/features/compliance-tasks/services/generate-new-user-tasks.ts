import { Payload } from 'payload'
import { User } from '@/types/payload-types'
import { ComplianceTaskGenerator } from './compliance-task-generator'

export const SKIP_COMPLIANCE_TASK_GENERATION = 'skipComplianceTaskGeneration'

type GenerateNewUserComplianceTasksArgs = {
  payload: Payload
  user: User
  actorId?: number
}

// Awaited directly instead of setTimeout so task generation completes within the
// serverless function lifecycle (Vercel suspends the function after the response
// is sent, causing deferred callbacks to never execute — GIQ-81).
export const generateNewUserComplianceTasks = async ({
  payload,
  user,
  actorId,
}: GenerateNewUserComplianceTasksArgs): Promise<void> => {
  try {
    const generator = new ComplianceTaskGenerator(payload)
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
