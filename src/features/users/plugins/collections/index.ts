import type { CollectionConfig } from 'payload'
import { UserRolesEnum, UserStatusEnum } from '@/features/users/schemas'
import {
  createUser,
  updateUser,
  getOrganizationUsers,
  updateUserAccess,
  setUserApprovalStatus,
  userForgotPassword,
  userResetPassword,
} from '../endpoints'
import { canReadUsers } from '../access'
import { AccessControl } from '@/shared/utils/rbac'
import { Organization } from '@/types/payload-types'
import { getAccessibleOrgIdsForUser } from '@/shared'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    read: canReadUsers,
    create: async ({ req: { user, payload: _payload }, data }) => {
      if (!user) return false
      const access = new AccessControl(user)

      if (user.role === UserRolesEnum.SuperAdmin) {
        return access.can('create', 'USERS')
      }

      if (user.role === UserRolesEnum.UnitAdmin) {
        if (!access.can('create', 'USERS')) return false

        if (!data || !data.organizations || !Array.isArray(data.organizations)) return false

        const accessibleOrgIds = await getAccessibleOrgIdsForUser(user)
        if (accessibleOrgIds.length === 0) return false

        const assignedOrgIds = data.organizations.map((org: string | { id: number }) =>
          typeof org === 'object' ? org.id : org,
        )

        const allOrgsAccessible = assignedOrgIds.every((orgId: number) =>
          accessibleOrgIds.includes(orgId),
        )

        return allOrgsAccessible
      }

      return false
    },
    update: async ({ req: { user, payload }, id }) => {
      if (!user) return false
      const access = new AccessControl(user)

      if (user.role === UserRolesEnum.SuperAdmin) {
        return access.can('update', 'USERS')
      }

      if (user.role === UserRolesEnum.UnitAdmin) {
        if (!access.can('update', 'USERS')) return false

        if (!id || typeof id !== 'string') return false

        try {
          const targetUser = await payload.findByID({
            collection: 'users',
            id: id as string,
          })

          if (!targetUser) return false

          const accessibleOrgIds = await getAccessibleOrgIdsForUser(user)
          if (accessibleOrgIds.length === 0) return false

          const targetUserOrgs = targetUser.organizations as Organization[]
          if (!targetUserOrgs || targetUserOrgs.length === 0) return false

          const hasAccess = targetUserOrgs.some((org) =>
            accessibleOrgIds.includes(typeof org === 'object' ? org.id : org),
          )

          return hasAccess
        } catch (error) {
          console.error('Error checking user update access:', error)
          return false
        }
      }

      return false
    },
    delete: async ({ req: { user } }) => {
      if (!user) return false
      const access = new AccessControl(user)
      return access.can('delete', 'USERS')
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
  ],
  endpoints: [
    createUser,
    getOrganizationUsers,
    updateUser,
    updateUserAccess,
    setUserApprovalStatus,
    userForgotPassword,
    userResetPassword,
  ],
}
