import { CollectionConfig } from 'payload'
import { AuditLogActionEnum } from '../types/index'
import { canReadAuditLog } from '../access'

export const AuditLogs: CollectionConfig = {
  slug: 'audit_log',
  access: {
    read: canReadAuditLog,
  },
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
        {
          label: 'User Creation',
          value: AuditLogActionEnum.UserCreation,
        },
        {
          label: 'Password Recovery',
          value: AuditLogActionEnum.PasswordRecovery,
        },
        {
          label: 'Password Reset',
          value: AuditLogActionEnum.PasswordReset,
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
    {
      name: 'organizations',
      type: 'relationship',
      relationTo: 'organization',
      hasMany: true,
    },
    {
      name: 'metadata',
      type: 'json',
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: false,
      hasMany: false,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          async ({ req, data }) => {
            if (data == null) return data
            if (!data.tenant && req.user?.tenant) {
              data.tenant = req.user.tenant
            }
            return data
          },
        ],
      },
    },
  ],
  timestamps: true,
}
