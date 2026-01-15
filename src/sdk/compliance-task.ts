import { env } from '@/config/env'
import { JSON_HEADERS } from '@/shared/constants'

const completeTaskEndpoint = async (taskId: number, endpoint: string, errorMessage: string) => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_BASE_URL}/api/compliance_tasks/${taskId}/${endpoint}`,
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      credentials: 'include',
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorMessage)
  }

  return response.json()
}

const postComplianceTaskAction = async <T>(
  endpoint: string,
  body: unknown,
  errorMessage: string,
): Promise<T> => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/compliance_tasks/${endpoint}`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorMessage)
  }

  return response.json()
}

export const completeComplianceTask = async (taskId: number, notes?: string) => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_BASE_URL}/api/compliance_tasks/${taskId}/complete`,
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      credentials: 'include',
      body: JSON.stringify({ notes: notes || '' }),
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to complete task')
  }

  return response.json()
}

export const completePasswordSetupTask = (taskId: number) =>
  completeTaskEndpoint(taskId, 'complete-password-setup', 'Failed to complete password setup')

export const completeTrainingTask = (taskId: number) =>
  completeTaskEndpoint(taskId, 'complete-training', 'Failed to complete training')

export const completeRollCallTask = (taskId: number) =>
  completeTaskEndpoint(taskId, 'complete-roll-call', 'Failed to complete roll call')

export const completeUserPasswordTask = (taskId: number) =>
  completeTaskEndpoint(
    taskId,
    'complete-user-password',
    'Failed to complete user password confirmation',
  )

export const completeSharedPasswordTask = (taskId: number) =>
  completeTaskEndpoint(
    taskId,
    'complete-shared-password',
    'Failed to complete shared password confirmation',
  )

export const completeTwoFactorTask = (taskId: number) =>
  completeTaskEndpoint(taskId, 'complete-2fa', 'Failed to complete 2FA confirmation')

export const generateRollCallForUser = (userId: number, tenantId: number) =>
  postComplianceTaskAction(
    'generate-roll-call',
    { userId, tenantId },
    'Failed to generate Roll Call',
  )

export const getRollCallStatus = (userIds: number[]) =>
  postComplianceTaskAction('roll-call-status', { userIds }, 'Failed to get Roll Call status')
