import { CollectionConfig } from 'payload'
import {
  createOrganization,
  disableOrganization,
  filteredUsers,
  updateOrganization,
} from '../endpoints'
import { canDeleteUnit, canReadUnit } from '../access'
import { unitTypeOptions } from '@/features/organizations/constants/unitTypeOptions'

export const Organizations: CollectionConfig = {
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
      required: true,
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
  ],
  timestamps: true,
  endpoints: [createOrganization, updateOrganization, disableOrganization, filteredUsers],
}
