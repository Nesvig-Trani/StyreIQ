import { CollectionConfig } from 'payload'

export const OrganizationAccess: CollectionConfig = {
  slug: 'organization_access',
  fields: [
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organization',
      hasMany: false,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Temporary', value: 'temporary' },
        { label: 'Permanent', value: 'permanent' },
      ],
    },
    {
      name: 'start_date',
      type: 'date',
    },
    {
      name: 'end_date',
      type: 'date',
    },
  ],
}
