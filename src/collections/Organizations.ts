import type { CollectionConfig } from 'payload'

export const Organizations: CollectionConfig = {
  slug: 'organization',
  admin: {
    useAsTitle: 'name',
  },
  access: {},
  fields: [
    {
      name: 'name',
      type: 'text',
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
  ],
}
