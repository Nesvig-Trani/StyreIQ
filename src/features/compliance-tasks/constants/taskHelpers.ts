import { ComplianceTask } from '@/types/payload-types'
import { ComplianceTaskType } from '../schema'

export function getTaskTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    [ComplianceTaskType.PASSWORD_SETUP]: 'Set Up Password & 2FA',
    [ComplianceTaskType.CONFIRM_USER_PASSWORD]: 'Confirm Personal Password Update',
    [ComplianceTaskType.CONFIRM_SHARED_PASSWORD]: 'Confirm Shared Account Password Update',
    [ComplianceTaskType.CONFIRM_2FA]: 'Confirm Two-Factor Authentication (2FA)',
    [ComplianceTaskType.POLICY_ACKNOWLEDGMENT]: 'Acknowledge Policy',
    [ComplianceTaskType.TRAINING_COMPLETION]: 'Complete Required Training',
    [ComplianceTaskType.USER_ROLL_CALL]: 'Confirm Your Role and Assigned Accounts',
    [ComplianceTaskType.REVIEW_FLAG]: 'Review Risk Flag',
  }
  return labels[type] || type
}

export function getActionUrlForTask(task: ComplianceTask): string {
  const taskTypeMap: Record<string, string> = {
    PASSWORD_SETUP: 'password-setup',
    CONFIRM_USER_PASSWORD: 'user-password',
    CONFIRM_SHARED_PASSWORD: 'shared-password',
    CONFIRM_2FA: '2fa',
    POLICY_ACKNOWLEDGMENT: 'policy',
    TRAINING_COMPLETION: 'training',
    USER_ROLL_CALL: 'roll-call',
    REVIEW_FLAG: 'review-flag',
  }

  const taskType = taskTypeMap[task.type]
  return `/dashboard/compliance/${taskType}/${task.id}`
}

export function getTaskStatusColor(status: string): 'default' | 'destructive' | 'secondary' {
  switch (status) {
    case 'OVERDUE':
    case 'ESCALATED':
      return 'destructive'
    case 'COMPLETED':
      return 'secondary'
    case 'PENDING':
    default:
      return 'default'
  }
}
