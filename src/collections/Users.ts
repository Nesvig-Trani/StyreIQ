import type { CollectionConfig } from 'payload'
import { UserRolesEnum, UserStatusEnum } from '@/types/users'
import { createUser } from '@/endpoints/users'
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
      name: 'organization',
      type: 'relationship',
      relationTo: 'organization',
      hasMany: false,
    },
  ],
  endpoints: [createUser],
}
