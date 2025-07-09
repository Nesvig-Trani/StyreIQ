import { CollectionConfig } from 'payload'
import { createOrganization, updateOrganization } from '@/plugins/organizations/endpoints'
import { canDeleteOrganizations, canReadOrganizations } from '@/plugins/organizations/access'

export const Organizations: CollectionConfig = {
  slug: 'organization',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: canReadOrganizations,
    delete: canDeleteOrganizations,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'University', value: 'university' },
        { label: 'Faculty', value: 'faculty' },
        { label: 'Department', value: 'department' },
        { label: 'Office', value: 'office' },
        { label: 'Project', value: 'project' },
      ],
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
  ],
  timestamps: true,
  endpoints: [createOrganization, updateOrganization],
}
