import { AuditLogActionEnum } from '@/features/audit-log/plugins/types'

export const actionLabels = {
  [AuditLogActionEnum.Create]: 'Create',
  [AuditLogActionEnum.Update]: 'Update',
  [AuditLogActionEnum.Delete]: 'Delete',
  [AuditLogActionEnum.Approval]: 'Approval',
  [AuditLogActionEnum.FlagResolution]: 'Flag Resolution',
  [AuditLogActionEnum.PolicyAcknowledgement]: 'Policy Acknowledgment',
  [AuditLogActionEnum.UserCreation]: 'User Creation',
  [AuditLogActionEnum.PasswordRecovery]: 'Password Recovery',
  [AuditLogActionEnum.PasswordReset]: 'Password Reset',
  [AuditLogActionEnum.ComplianceTasksGenerated]: 'Compliance Tasks Generated',
  [AuditLogActionEnum.TaskEscalation]: 'Task Escalation',
  [AuditLogActionEnum.RoleRequestApproved]: 'Role Request Approved',
  [AuditLogActionEnum.RoleRequestRejected]: 'Role Request Rejected',
  [AuditLogActionEnum.TaskCompleted]: 'Task Completed',
  [AuditLogActionEnum.TrainingCompleted]: 'Training Completed',
  [AuditLogActionEnum.PasswordSetupCompleted]: 'Password Setup Completed',
  [AuditLogActionEnum.RollCallCompleted]: 'Roll Call Completed',
}
