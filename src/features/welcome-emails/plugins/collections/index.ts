import { CollectionConfig } from 'payload'
import { WelcomeEmailCollectionSlug } from '../types'
import { injectTenantHook } from '@/features/tenants/hooks/inject-tenant'
import {
  adminOnlyCreateAccess,
  adminOnlyUpdateAccess,
  superAdminOnlyDeleteAccess,
  tenantBasedReadAccess,
} from '@/features/tenants/plugins/collections/helpers/access-control-helpers'

export const WelcomeEmails: CollectionConfig = {
  slug: WelcomeEmailCollectionSlug,
  access: {
    read: tenantBasedReadAccess,
    create: adminOnlyCreateAccess,
    update: adminOnlyUpdateAccess,
    delete: superAdminOnlyDeleteAccess,
  },
  fields: [
    {
      name: 'instructions',
      type: 'textarea',
      label: 'Instructions',
      required: true,
    },
    {
      name: 'responsibilities',
      type: 'array',
      label: 'Responsibilities',
      minRows: 0,
      fields: [
        {
          name: 'responsibility',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'policyLinks',
      type: 'array',
      label: 'Policy Links',
      minRows: 0,
      fields: [
        {
          name: 'id',
          type: 'text',
          label: 'ID',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          label: 'Title',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          label: 'URL',
          required: true,
        },
      ],
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
  ],
}
