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
} from '../endpoints'
import { AccessControl } from '@/shared/utils/rbac'
import { Organization } from '@/types/payload-types'
import { getAccessibleOrgIdsForUser, getAccessibleOrgIdsForUserWithPayload } from '@/shared'
import { injectTenantHook } from '@/features/tenants/hooks/inject-tenant'

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
          return { id: { equals: id } }

        default:
          return false
      }
    },

    create: async ({ req: { user }, data }) => {
      if (!user) return false

      const { role, tenant } = user
      const access = new AccessControl(user)

      if (role === UserRolesEnum.SuperAdmin) {
        return access.can('create', 'USERS')
      }

      if (!access.can('create', 'USERS')) return false
      if (!tenant) return false

      if (data?.tenant && data.tenant !== tenant) return false

      switch (role) {
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

      const { role, tenant } = user
      const access = new AccessControl(user)

      if (role === UserRolesEnum.SuperAdmin) {
        return access.can('update', 'USERS')
      }

      if (!access.can('update', 'USERS')) return false

      try {
        const targetUser = await payload.findByID({
          collection: 'users',
          id: id as string,
        })

        if (!targetUser) return false

        if (targetUser.tenant !== tenant) return false
        if (data?.tenant && data.tenant !== tenant) return false

        switch (role) {
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

      const { role, tenant } = user
      const access = new AccessControl(user)

      if (!access.can('delete', 'USERS')) return false

      switch (role) {
        case UserRolesEnum.SuperAdmin:
          return true

        case UserRolesEnum.CentralAdmin: {
          try {
            const targetUser = await payload.findByID({
              collection: 'users',
              id: id as string,
            })

            if (!targetUser) return false

            return targetUser.tenant === tenant
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
      name: 'role',
      type: 'select',
      options: [
        {
          label: 'Super Admin',
          value: UserRolesEnum.SuperAdmin,
        },
        {
          label: 'Central Admin',
          value: UserRolesEnum.CentralAdmin,
        },
        { label: 'Unit Admin', value: UserRolesEnum.UnitAdmin },
        {
          label: 'Social Media Manager',
          value: UserRolesEnum.SocialMediaManager,
        },
      ],
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
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'update' && data.tenant) {
          const existing = await req.payload.findByID({
            collection: 'users',
            id: data.id,
          })

          if (existing && existing.tenant !== data.tenant) {
            throw new Error('Cannot change tenant assignment after user creation')
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
  ],
}
