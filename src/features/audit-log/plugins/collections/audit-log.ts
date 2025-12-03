import { CollectionConfig, Where } from 'payload'
import { AuditLogActionEnum } from '../types/index'
import { injectTenantHook } from '@/features/tenants/hooks/inject-tenant'
import { UserRolesEnum } from '@/features/users'
import { getAccessibleOrgIdsForUserWithPayload } from '@/shared'
import { superAdminOnlyDeleteAccess } from '@/features/tenants/plugins/collections/helpers/access-control-helpers'

export const AuditLogs: CollectionConfig = {
  slug: 'audit_log',
  access: {
    read: async ({ req }): Promise<boolean | Where> => {
      const { user, payload } = req
      if (!user) return false

      const { role, tenant, id } = user

      if (role === UserRolesEnum.SuperAdmin) return true
      if (!tenant) return false

      switch (role) {
        case UserRolesEnum.CentralAdmin:
          return { tenant: { equals: tenant } }

        case UserRolesEnum.UnitAdmin: {
          const accessibleOrgIds = await getAccessibleOrgIdsForUserWithPayload(user, payload)
          return {
            and: [{ tenant: { equals: tenant } }, { organizations: { in: accessibleOrgIds } }],
          }
        }

        case UserRolesEnum.SocialMediaManager:
          return {
            and: [{ tenant: { equals: tenant } }, { user: { equals: id } }],
          }

        default:
          return false
      }
    },

    create: async ({ req }) => !!req.user,
    update: async () => false,
    delete: superAdminOnlyDeleteAccess,
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
        {
          label: 'Compliance Tasks Generated',
          value: AuditLogActionEnum.ComplianceTasksGenerated,
        },
        {
          label: 'Task Escalation',
          value: AuditLogActionEnum.TaskEscalation,
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
        beforeChange: [injectTenantHook],
      },
    },
  ],
  timestamps: true,
}
