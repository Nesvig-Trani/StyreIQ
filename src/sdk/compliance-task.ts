import { env } from '@/config/env'
import { JSON_HEADERS } from '@/shared/constants'

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

export const completePasswordSetupTask = async (taskId: number) => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_BASE_URL}/api/compliance_tasks/${taskId}/complete-password-setup`,
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      credentials: 'include',
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to complete password setup')
  }

  return response.json()
}

export const completeTrainingTask = async (taskId: number) => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_BASE_URL}/api/compliance_tasks/${taskId}/complete-training`,
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      credentials: 'include',
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to complete training')
  }

  return response.json()
}

export const completeRollCallTask = async (taskId: number) => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_BASE_URL}/api/compliance_tasks/${taskId}/complete-roll-call`,
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      credentials: 'include',
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to complete roll call')
  }

  return response.json()
}
