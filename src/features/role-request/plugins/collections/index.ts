import { CollectionConfig, Where } from 'payload'
import { UserRolesEnum } from '@/features/users'
import { injectTenantHook } from '@/features/tenants/hooks/inject-tenant'
import {
  normalizeRoles,
  normalizeActiveRole,
  getEffectiveRole,
} from '@/shared/utils/role-hierarchy'
import { approveRoleRequest, createRoleRequest } from '../endpoints'
import { extractTenantId } from '@/features/tenants/plugins/collections/helpers/access-control-helpers'

export const RoleRequests: CollectionConfig = {
  slug: 'role-requests',
  admin: {
    useAsTitle: 'id',
    description: 'Requests for additional user roles',
    group: 'Users',
  },
  access: {
    read: ({ req: { user } }): boolean | Where => {
      if (!user) return false

      const roles = normalizeRoles(user.roles)
      const activeRole = normalizeActiveRole(user.active_role)
      const effectiveRole = getEffectiveRole(roles, activeRole)

      if (effectiveRole === UserRolesEnum.SuperAdmin) return true

      const tenantId = extractTenantId(user)
      if (!tenantId) return false

      switch (effectiveRole) {
        case UserRolesEnum.CentralAdmin:
          return { tenant: { equals: tenantId } }
        case UserRolesEnum.UnitAdmin:
        case UserRolesEnum.SocialMediaManager:
          return {
            and: [{ user: { equals: user.id } }, { tenant: { equals: tenantId } }],
          }

        default:
          return false
      }
    },
    create: ({ req: { user } }) => !!user,

    update: ({ req: { user } }) => {
      if (!user) return false

      const roles = normalizeRoles(user.roles)
      const activeRole = normalizeActiveRole(user.active_role)
      const effectiveRole = getEffectiveRole(roles, activeRole)

      return [UserRolesEnum.SuperAdmin, UserRolesEnum.CentralAdmin].includes(effectiveRole)
    },

    delete: ({ req: { user } }) => {
      if (!user) return false

      const roles = normalizeRoles(user.roles)
      const activeRole = normalizeActiveRole(user.active_role)
      const effectiveRole = getEffectiveRole(roles, activeRole)

      return effectiveRole === UserRolesEnum.SuperAdmin
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true,
        description: 'User requesting the additional role',
      },
    },
    {
      name: 'requestedRole',
      type: 'select',
      required: true,
      options: [
        { label: 'Unit Admin', value: UserRolesEnum.UnitAdmin },
        { label: 'Social Media Manager', value: UserRolesEnum.SocialMediaManager },
        { label: 'Central Admin', value: UserRolesEnum.CentralAdmin },
      ],
      admin: {
        description: 'Role being requested',
      },
    },
    {
      name: 'unitId',
      type: 'relationship',
      relationTo: 'organization',
      required: false,
      admin: {
        description: 'Unit for which the role is requested (for SMM role)',
        condition: (data) => data.requestedRole === UserRolesEnum.SocialMediaManager,
      },
    },
    {
      name: 'justification',
      type: 'textarea',
      required: true,
      minLength: 20,
      maxLength: 500,
      admin: {
        description: 'Explain why you need this additional role',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'approvedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Admin who approved/rejected this request',
      },
    },
    {
      name: 'reviewNotes',
      type: 'textarea',
      admin: {
        description: 'Notes from the approver',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
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
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create' && !data.user) {
          data.user = req.user?.id
        }

        if (operation === 'create' && data.user && data.requestedRole) {
          const user = await req.payload.findByID({
            collection: 'users',
            id: data.user,
          })

          const userRoles = normalizeRoles(user.roles)
          if (userRoles.includes(data.requestedRole as UserRolesEnum)) {
            throw new Error(`You already have the ${data.requestedRole} role`)
          }
        }
      },
    ],
  },
  endpoints: [createRoleRequest, approveRoleRequest],
}
