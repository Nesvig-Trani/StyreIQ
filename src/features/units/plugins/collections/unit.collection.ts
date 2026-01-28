import { CollectionConfig } from 'payload'
import { createUnit, disableUnit, filteredUsers, updateUnit } from '../endpoints'
import { unitTypeOptions } from '@/features/units/constants/unitTypeOptions'
import { UserRolesEnum } from '@/features/users'
import { getAccessibleOrgIdsForUser, getAccessibleOrgIdsForUserWithPayload } from '@/shared'
import { injectTenantHook } from '@/features/tenants/hooks/inject-tenant'
import {
  extractTenantId,
  superAdminOnlyDeleteAccess,
  tenantCreateAccess,
} from '@/features/tenants/plugins/collections/helpers/access-control-helpers'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

export const Unit: CollectionConfig = {
  slug: 'organization',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: async ({ req }) => {
      const { user, payload } = req
      if (!user) return false

      const effectiveRole = getEffectiveRoleFromUser(user)

      if (effectiveRole === UserRolesEnum.SuperAdmin) return true

      const tenantId = extractTenantId(user)
      if (!tenantId) return false

      const accessibleOrgIds = await getAccessibleOrgIdsForUserWithPayload(user, payload)

      return {
        tenant: { equals: tenantId },
        id: { in: accessibleOrgIds },
      }
    },

    create: tenantCreateAccess,

    update: async ({ req, id, data }) => {
      const { user, payload } = req
      if (!user || !id) return false

      const effectiveRole = getEffectiveRoleFromUser(user)

      if (effectiveRole === UserRolesEnum.SuperAdmin) return true

      const tenantId = extractTenantId(user)
      if (!tenantId) return false

      if (data?.tenant && data.tenant !== tenantId) return false

      switch (effectiveRole) {
        case UserRolesEnum.CentralAdmin:
          return { tenant: { equals: tenantId } }

        case UserRolesEnum.UnitAdmin: {
          const targetOrg = await payload.findByID({
            collection: 'organization',
            id: id as string | number,
          })

          if (!targetOrg?.parentOrg) return false

          const accessibleOrgIds = await getAccessibleOrgIdsForUserWithPayload(user, payload)
          return accessibleOrgIds.includes(Number(id))
        }

        default:
          return false
      }
    },

    delete: superAdminOnlyDeleteAccess,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      maxLength: 100,
      required: true,
      unique: true,
    },
    {
      name: 'type',
      type: 'select',
      options: unitTypeOptions,
      required: true,
    },
    {
      name: 'parentOrg',
      type: 'relationship',
      relationTo: 'organization',
    },
    {
      name: 'admin',
      type: 'relationship',
      relationTo: 'users',
      required: false,
    },
    {
      name: 'backupAdmins',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
    },
    {
      name: 'websiteUrl',
      type: 'text',
      label: 'Website URL',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Pending Review', value: 'pending_review' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 200,
    },
    {
      name: 'delegatedPermissions',
      type: 'checkbox',
    },
    {
      name: 'path',
      type: 'text',
    },
    {
      name: 'depth',
      type: 'number',
    },
    {
      name: 'children',
      type: 'join',
      collection: 'organization',
      on: 'parentOrg',
    },
    {
      name: 'disabled',
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
    {
      name: 'isPrimaryUnit',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        const effectiveRole = getEffectiveRoleFromUser(req.user)
        const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin
        const isUnitAdmin = effectiveRole === UserRolesEnum.UnitAdmin
        if (operation === 'create' && isUnitAdmin) {
          if (!data.parentOrg) {
            throw new Error(
              'Unit Admins cannot create main units. A parent organization is required.',
            )
          }

          const accessibleOrgIds = await getAccessibleOrgIdsForUser(req.user)
          const parentId = typeof data.parentOrg === 'object' ? data.parentOrg.id : data.parentOrg

          if (!accessibleOrgIds.includes(Number(parentId))) {
            throw new Error('You do not have access to the specified parent organization.')
          }
        }

        if (operation === 'update' && isUnitAdmin) {
          if (originalDoc && !originalDoc.parentOrg) {
            throw new Error('Unit Admins cannot edit main units. Only sub-units can be modified.')
          }

          if (data.parentOrg === null) {
            throw new Error('Unit Admins cannot remove parent organization.')
          }
        }

        if (operation === 'update' && data.isPrimaryUnit !== undefined) {
          if (originalDoc?.isPrimaryUnit !== data.isPrimaryUnit && !isSuperAdmin) {
            throw new Error('Only SuperAdmin can modify Primary Unit status.')
          }
        }
      },
    ],
  },
  timestamps: true,
  endpoints: [createUnit, updateUnit, disableUnit, filteredUsers],
}
