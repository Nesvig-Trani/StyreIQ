import type { CollectionConfig, Where } from 'payload'
import { UserRolesEnum, UserStatusEnum } from '@/features/users/schemas'
import {
  createUser,
  updateUser,
  getOrganizationUsers,
  updateUserAccess,
  setUserApprovalStatus,
  userForgotPassword,
  userResetPassword,
  requestDemo,
  switchUserRole,
} from '../endpoints'
import { AccessControl } from '@/shared/utils/rbac'
import { Organization } from '@/types/payload-types'
import { getAccessibleOrgIdsForUser, getAccessibleOrgIdsForUserWithPayload } from '@/shared'
import { injectTenantHook } from '@/features/tenants/hooks/inject-tenant'

import { ComplianceTaskGenerator } from '@/features/compliance-tasks/services/compliance-task-generator'
import { extractTenantId } from '@/features/tenants/plugins/collections/helpers/access-control-helpers'
import {
  getEffectiveRole,
  getEffectiveRoleFromUser,
  validateRoleCompatibility,
} from '@/shared/utils/role-hierarchy'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    read: async ({ req }): Promise<boolean | Where> => {
      const { user, payload } = req
      if (!user) return false

      const { id } = user
      const effectiveRole = getEffectiveRoleFromUser(user)
      if (effectiveRole === UserRolesEnum.SuperAdmin) return true
      const tenantId = extractTenantId(user)
      if (!tenantId) return false

      switch (effectiveRole) {
        case UserRolesEnum.CentralAdmin:
          return { tenant: { equals: tenantId } }

        case UserRolesEnum.UnitAdmin: {
          const accessibleOrgIds = await getAccessibleOrgIdsForUserWithPayload(user, payload)
          return {
            and: [{ tenant: { equals: tenantId } }, { organizations: { in: accessibleOrgIds } }],
          }
        }

        case UserRolesEnum.SocialMediaManager:
          return { id: { equals: id } }

        default:
          return false
      }
    },

    create: async ({ req: { user }, data }) => {
      if (!user) return false

      const effectiveRole = getEffectiveRoleFromUser(user)
      const access = new AccessControl(user)

      if (effectiveRole === UserRolesEnum.SuperAdmin) {
        return access.can('create', 'USERS')
      }

      if (!access.can('create', 'USERS')) return false
      const tenantId = extractTenantId(user)
      if (!tenantId) return false

      if (data?.tenant && data.tenant !== tenantId) return false

      switch (effectiveRole) {
        case UserRolesEnum.CentralAdmin:
          return true

        case UserRolesEnum.UnitAdmin: {
          if (!data?.organizations || !Array.isArray(data.organizations)) return false

          const accessibleOrgIds = await getAccessibleOrgIdsForUser(user)
          if (accessibleOrgIds.length === 0) return false

          const assignedOrgIds = data.organizations.map((org: string | { id: number }) =>
            typeof org === 'object' ? org.id : org,
          )

          return assignedOrgIds.every((orgId: number) => accessibleOrgIds.includes(orgId))
        }

        default:
          return false
      }
    },

    update: async ({ req: { user, payload }, id, data }) => {
      if (!user || !id || typeof id !== 'string') return false
      const effectiveRole = getEffectiveRoleFromUser(user)
      const access = new AccessControl(user)

      if (effectiveRole === UserRolesEnum.SuperAdmin) {
        return access.can('update', 'USERS')
      }

      if (!access.can('update', 'USERS')) return false
      const tenantId = extractTenantId(user)

      try {
        const targetUser = await payload.findByID({
          collection: 'users',
          id: id as string,
        })

        if (!targetUser) return false

        const targetTenantId = extractTenantId({ tenant: targetUser.tenant } as typeof user)
        if (targetTenantId !== tenantId) return false
        if (data?.tenant && data.tenant !== tenantId) return false

        switch (effectiveRole) {
          case UserRolesEnum.CentralAdmin:
            return true

          case UserRolesEnum.UnitAdmin: {
            const accessibleOrgIds = await getAccessibleOrgIdsForUser(user)
            if (accessibleOrgIds.length === 0) return false

            const targetUserOrgs = targetUser.organizations as Organization[]
            if (!targetUserOrgs || targetUserOrgs.length === 0) return false

            return targetUserOrgs.some((org) =>
              accessibleOrgIds.includes(typeof org === 'object' ? org.id : org),
            )
          }

          case UserRolesEnum.SocialMediaManager:
            return targetUser.id === user.id

          default:
            return false
        }
      } catch {
        return false
      }
    },

    delete: async ({ req: { user, payload }, id }) => {
      if (!user || !id || typeof id !== 'string') return false

      const effectiveRole = getEffectiveRoleFromUser(user)
      const access = new AccessControl(user)

      if (!access.can('delete', 'USERS')) return false

      switch (effectiveRole) {
        case UserRolesEnum.SuperAdmin:
          return true

        case UserRolesEnum.CentralAdmin: {
          try {
            const tenantId = extractTenantId(user)

            const targetUser = await payload.findByID({
              collection: 'users',
              id: id as string,
            })

            if (!targetUser) return false

            const targetTenantId = extractTenantId({ tenant: targetUser.tenant } as typeof user)
            return targetTenantId === tenantId
          } catch {
            return false
          }
        }

        default:
          return false
      }
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      options: [
        { label: 'Super Admin', value: UserRolesEnum.SuperAdmin },
        { label: 'Central Admin', value: UserRolesEnum.CentralAdmin },
        { label: 'Unit Admin', value: UserRolesEnum.UnitAdmin },
        { label: 'Social Media Manager', value: UserRolesEnum.SocialMediaManager },
      ],
      defaultValue: [UserRolesEnum.SocialMediaManager],
    },
    {
      name: 'active_role',
      type: 'select',
      options: [
        { label: 'Super Admin', value: UserRolesEnum.SuperAdmin },
        { label: 'Central Admin', value: UserRolesEnum.CentralAdmin },
        { label: 'Unit Admin', value: UserRolesEnum.UnitAdmin },
        { label: 'Social Media Manager', value: UserRolesEnum.SocialMediaManager },
      ],
      admin: {
        description: 'Currently active role (for users with multiple roles)',
        readOnly: false,
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: UserStatusEnum.Active },
        { label: 'Inactive', value: UserStatusEnum.Inactive },
        { label: 'Rejected', value: UserStatusEnum.Rejected },
        { label: 'Pending Activation', value: UserStatusEnum.PendingActivation },
      ],
    },
    {
      name: 'admin_policy_agreement',
      type: 'checkbox',
      required: true,
      defaultValue: false,
    },
    {
      name: 'date_of_last_policy_review',
      type: 'date',
    },
    {
      name: 'date_of_last_training',
      type: 'date',
    },
    {
      name: 'organizations',
      type: 'relationship',
      relationTo: 'organization',
      hasMany: true,
    },
    {
      name: 'reject_reason',
      type: 'text',
    },
    {
      name: 'isEnabledTwoFactor',
      type: 'checkbox',
    },
    {
      name: 'isInUseSecurePassword',
      type: 'checkbox',
    },
    {
      name: 'isCompletedTrainingAccessibility',
      type: 'checkbox',
    },
    {
      name: 'isCompletedTrainingRisk',
      type: 'checkbox',
    },
    {
      name: 'isCompletedTrainingBrand',
      type: 'checkbox',
    },
    {
      name: 'isCompletedTrainingCompliance',
      type: 'checkbox',
    },
    {
      name: 'isCompletedTrainingGovernance',
      type: 'checkbox',
    },
    {
      name: 'hasKnowledgeStandards',
      type: 'checkbox',
    },
    {
      name: 'passwordUpdatedAt',
      type: 'date',
    },
    {
      name: 'offboardingCompleted',
      type: 'checkbox',
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
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create') {
          setTimeout(async () => {
            try {
              const generator = new ComplianceTaskGenerator(req.payload)
              await generator.generateTasksForNewUser(doc)

              await req.payload.create({
                collection: 'audit_log',
                data: {
                  user: req.user?.id || doc.id,
                  action: 'compliance_task_generated',
                  entity: 'users',
                  metadata: {
                    userId: doc.id,
                    tasksGenerated: [
                      'PASSWORD_SETUP',
                      'POLICY_ACKNOWLEDGMENT',
                      'TRAINING_COMPLETION',
                      'USER_ROLL_CALL',
                    ],
                  },
                  tenant: doc.tenant,
                },
              })
            } catch (error) {
              console.error('Error generating compliance tasks:', error)
            }
          }, 1000)
        }
      },
    ],
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        if (operation === 'update' && data.tenant && originalDoc?.tenant !== data.tenant) {
          throw new Error('Cannot change tenant assignment after user creation')
        }

        if ((operation === 'create' || operation === 'update') && data.roles) {
          const validation = validateRoleCompatibility(data.roles)

          if (!validation.valid) {
            throw new Error(`Role assignment error: ${validation.errors.join(', ')}`)
          }
        }

        if (data.roles) {
          const currentActiveRole = data.active_role ?? originalDoc?.active_role

          if (currentActiveRole && !data.roles.includes(currentActiveRole)) {
            data.active_role = getEffectiveRole(data.roles)
          }
        }

        if (operation === 'create' && data.roles && !data.active_role) {
          data.active_role = getEffectiveRole(data.roles)
        }

        if (
          operation === 'create' &&
          data.roles?.includes(UserRolesEnum.CentralAdmin) &&
          data.tenant
        ) {
          try {
            const tenantId = typeof data.tenant === 'object' ? data.tenant.id : data.tenant

            const tenant = await req.payload.findByID({
              collection: 'tenants',
              id: tenantId,
            })

            const primaryUnitId =
              tenant.primaryUnit && typeof tenant.primaryUnit === 'object'
                ? tenant.primaryUnit.id
                : tenant.primaryUnit

            if (primaryUnitId) {
              const currentOrgs = data.organizations ?? []

              if (!currentOrgs.includes(primaryUnitId)) {
                data.organizations = [...currentOrgs, primaryUnitId]
              }
            }
          } catch (error) {
            req.payload.logger.error('Failed to inherit Primary Unit', { error })
          }
        }

        return data
      },
    ],
  },
  endpoints: [
    createUser,
    getOrganizationUsers,
    updateUser,
    updateUserAccess,
    setUserApprovalStatus,
    userForgotPassword,
    userResetPassword,
    requestDemo,
    switchUserRole,
  ],
}
