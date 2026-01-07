import { injectTenantHook } from '@/features/tenants/hooks/inject-tenant'
import { UserRolesEnum } from '@/features/users'
import { getAccessibleOrgIdsForUserWithPayload } from '@/shared'
import { CollectionConfig, Where } from 'payload'
import { ComplianceTaskStatus, ComplianceTaskType } from '../../schema'
import {
  adminOnlyCreateAccess,
  superAdminOnlyDeleteAccess,
} from '@/features/tenants/plugins/collections/helpers/access-control-helpers'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
import {
  completePasswordSetupEndpoint,
  completeRollCallEndpoint,
  completeSharedPasswordEndpoint,
  completeTaskEndpoint,
  completeTrainingEndpoint,
  completeTwoFactorEndpoint,
  completeUserPasswordEndpoint,
} from '../endpoints'

export const ComplianceTasks: CollectionConfig = {
  slug: 'compliance_tasks',
  admin: {
    useAsTitle: 'type',
    description: 'Automatically generated compliance tasks for users',
    group: 'Compliance',
  },
  access: {
    read: async ({ req }): Promise<boolean | Where> => {
      const { user, payload } = req
      if (!user) return false

      const { tenant, id } = user
      const effectiveRole = getEffectiveRoleFromUser(user)

      if (effectiveRole === UserRolesEnum.SuperAdmin) return true
      if (!tenant) return false

      const tenantId = typeof tenant === 'object' ? tenant.id : tenant

      switch (effectiveRole) {
        case UserRolesEnum.CentralAdmin:
          return { tenant: { equals: tenantId } }

        case UserRolesEnum.UnitAdmin: {
          const accessibleOrgIds = await getAccessibleOrgIdsForUserWithPayload(user, payload)

          const usersInScope = await payload.find({
            collection: 'users',
            where: {
              organizations: { in: accessibleOrgIds },
              tenant: { equals: tenantId },
            },
            limit: 0,
          })

          const userIds = usersInScope.docs.map((u) => u.id)

          return {
            tenant: { equals: tenantId },
            assignedUser: { in: userIds },
          }
        }

        case UserRolesEnum.SocialMediaManager:
          return {
            tenant: { equals: tenantId },
            assignedUser: { equals: id },
          }

        default:
          return false
      }
    },
    create: adminOnlyCreateAccess,
    update: async ({ req, id }) => {
      const { user, payload } = req
      if (!user || !id) return false

      const { tenant, id: userId } = user
      const effectiveRole = getEffectiveRoleFromUser(user)

      if (effectiveRole === UserRolesEnum.SuperAdmin) return true
      if (!tenant) return false

      try {
        const task = await payload.findByID({
          collection: 'compliance_tasks',
          id: String(id),
        })

        if (!task) return false

        const tenantId = typeof tenant === 'object' ? tenant.id : tenant

        switch (effectiveRole) {
          case UserRolesEnum.CentralAdmin:
            return task.tenant === tenantId

          case UserRolesEnum.UnitAdmin:
          case UserRolesEnum.SocialMediaManager:
            return task.assignedUser === userId

          default:
            return false
        }
      } catch {
        return false
      }
    },
    delete: superAdminOnlyDeleteAccess,
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Password Setup', value: ComplianceTaskType.PASSWORD_SETUP },
        { label: 'Confirm User Password', value: ComplianceTaskType.CONFIRM_USER_PASSWORD },
        { label: 'Confirm Shared Password', value: ComplianceTaskType.CONFIRM_SHARED_PASSWORD },
        { label: 'Confirm 2FA', value: ComplianceTaskType.CONFIRM_2FA },
        { label: 'Policy Acknowledgment', value: ComplianceTaskType.POLICY_ACKNOWLEDGMENT },
        { label: 'Training Completion', value: ComplianceTaskType.TRAINING_COMPLETION },
        { label: 'User Roll Call', value: ComplianceTaskType.USER_ROLL_CALL },
      ],
      admin: {
        description: 'Type of compliance task',
      },
    },
    {
      name: 'assignedUser',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'User who must complete this task',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: ComplianceTaskStatus.PENDING,
      options: [
        { label: 'Pending', value: ComplianceTaskStatus.PENDING },
        { label: 'Completed', value: ComplianceTaskStatus.COMPLETED },
        { label: 'Overdue', value: ComplianceTaskStatus.OVERDUE },
        { label: 'Escalated', value: ComplianceTaskStatus.ESCALATED },
      ],
    },
    {
      name: 'dueDate',
      type: 'date',
      required: true,
      admin: {
        description: 'Deadline for task completion',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      admin: {
        description: 'When the task was completed',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Details about the task',
      },
    },
    {
      name: 'relatedPolicy',
      type: 'relationship',
      relationTo: 'policies',
      admin: {
        description: 'For POLICY_ACKNOWLEDGMENT tasks',
        condition: (data) => data.type === ComplianceTaskType.POLICY_ACKNOWLEDGMENT,
      },
    },
    {
      name: 'relatedTraining',
      type: 'text',
      admin: {
        description: 'For TRAINING_COMPLETION tasks',
        condition: (data) => data.type === ComplianceTaskType.TRAINING_COMPLETION,
      },
    },
    {
      name: 'remindersSent',
      type: 'array',
      fields: [
        {
          name: 'sentAt',
          type: 'date',
        },
        {
          name: 'daysSinceDue',
          type: 'number',
        },
      ],
      admin: {
        description: 'Log of reminders sent for this task',
      },
    },
    {
      name: 'escalations',
      type: 'array',
      fields: [
        {
          name: 'escalatedAt',
          type: 'date',
        },
        {
          name: 'escalatedTo',
          type: 'relationship',
          relationTo: 'users',
        },
        {
          name: 'reason',
          type: 'text',
        },
      ],
      admin: {
        description: 'Escalation history (SMM → Unit Admin → Central Admin)',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
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
  endpoints: [
    completeTaskEndpoint,
    completePasswordSetupEndpoint,
    completeTrainingEndpoint,
    completeUserPasswordEndpoint,
    completeSharedPasswordEndpoint,
    completeTwoFactorEndpoint,
    completeRollCallEndpoint,
  ],
  timestamps: true,
}
