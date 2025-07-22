import { AuditLogActionEnum } from '@/plugins/audit-log/types'

export const actionLabels = {
  [AuditLogActionEnum.Create]: 'Create',
  [AuditLogActionEnum.Update]: 'Update',
  [AuditLogActionEnum.Delete]: 'Delete',
  [AuditLogActionEnum.Approval]: 'Approval',
  [AuditLogActionEnum.FlagResolution]: 'Flag Resolution',
  [AuditLogActionEnum.PolicyAcknowledgement]: 'Policy Acknowledgment',
}
