import { CollectionConfig } from 'payload'
import { createUnit, disableUnit, filteredUsers, updateUnit } from '../endpoints'
import { canDeleteUnit, canReadUnit } from '../access'
import { unitTypeOptions } from '@/features/units/constants/unitTypeOptions'

export const Unit: CollectionConfig = {
  slug: 'organization',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: canReadUnit,
    delete: canDeleteUnit,
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
      name: 'email',
      type: 'email',
    },
    {
      name: 'phone',
      type: 'text',
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
    {
      name: 'isPrimaryUnit',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
  timestamps: true,
  endpoints: [createUnit, updateUnit, disableUnit, filteredUsers],
}
