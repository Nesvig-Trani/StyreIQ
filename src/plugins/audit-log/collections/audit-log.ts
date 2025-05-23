import { CollectionConfig } from 'payload'
import { AuditLogActionEnum } from '../types/index'

export const AuditLogs: CollectionConfig = {
  slug: 'audit_log',
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'action',
      type: 'select',
      options: [
        {
          label: 'Create',
          value: AuditLogActionEnum.Create,
        },
        { label: 'Update', value: AuditLogActionEnum.Update },
        {
          label: 'Delete',
          value: AuditLogActionEnum.Delete,
        },
        {
          label: 'Approval',
          value: AuditLogActionEnum.Approval,
        },
        {
          label: 'Flag Resolution',
          value: AuditLogActionEnum.FlagResolution,
        },
        {
          label: 'Policy Acknowledgment',
          value: AuditLogActionEnum.PolicyAcknowledgement,
        },
      ],
      required: true,
    },
    {
      name: 'entity',
      type: 'text',
      required: true,
    },
    {
      name: 'prev',
      type: 'json',
    },
    {
      name: 'current',
      type: 'json',
    },
  ],
  timestamps: true,
}
