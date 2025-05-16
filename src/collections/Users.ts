import type { CollectionConfig } from 'payload'
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
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
          value: 'super_admin',
        },
        { label: 'Unit Admin', value: 'unit_admin' },
        {
          label: 'Social Media Manager',
          value: 'social_media_manager',
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Pending Activation', value: 'pending_activation' },
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
      name: 'organization',
      type: 'relationship',
      relationTo: 'organization',
      hasMany: false,
    },
  ],
}
