import { CollectionConfig } from 'payload'
import { FlagHistoryActionsEnum, FlagSourceEnum, FlagStatusEnum } from '../../schemas'
import {
  FlagCommentsCollectionSlug,
  FlagHistoryCollectionSlug,
  FlagsCollectionSlug,
} from '../types'
import {
  authenticatedCreateAccess,
  immutableUpdateAccess,
  managerCreateAccess,
  managerUpdateAccess,
  ownerUpdateAccess,
  socialMediaManagerReadAccess,
  superAdminOnlyDeleteAccess,
  tenantBasedReadAccess,
} from '@/features/tenants/plugins/collections/helpers/access-control-helpers'
import { injectTenantHook } from '@/features/tenants/hooks/inject-tenant'
import { createComment, createFlag, markAsResolved } from '../endpoints'
import { flagStatusOptions } from '../../constants/flagStatusOptions'

export const Flags: CollectionConfig = {
  slug: FlagsCollectionSlug,
  access: {
    read: socialMediaManagerReadAccess,
    create: managerCreateAccess,
    update: managerUpdateAccess,
    delete: superAdminOnlyDeleteAccess,
  },
  fields: [
    {
      name: 'flagType',
      type: 'text',
    },
    {
      name: 'affectedEntity',
      type: 'relationship',
      relationTo: ['users', 'social-medias', 'organization'],
    },
    {
      name: 'organizations',
      type: 'relationship',
      relationTo: 'organization',
      hasMany: true,
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'dueDate',
      type: 'date',
    },
    {
      name: 'status',
      type: 'select',
      options: flagStatusOptions,
      defaultValue: FlagStatusEnum.PENDING,
    },
    {
      name: 'detectionDate',
      type: 'date',
    },
    {
      name: 'source',
      type: 'select',
      options: [
        { label: 'Automated System', value: FlagSourceEnum.AUTOMATED_SYSTEM },
        { label: 'Manual Flag', value: FlagSourceEnum.MANUAL_FLAG },
      ],
    },
    {
      name: 'lastActivity',
      type: 'date',
    },
    {
      name: 'history',
      type: 'join',
      collection: FlagHistoryCollectionSlug,
      on: 'flag',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'suggestedAction',
      type: 'textarea',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
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
  endpoints: [createFlag, markAsResolved],
}

export const FlagComments: CollectionConfig = {
  slug: FlagCommentsCollectionSlug,
  access: {
    read: tenantBasedReadAccess,
    create: authenticatedCreateAccess,
    update: ownerUpdateAccess(FlagCommentsCollectionSlug),
    delete: superAdminOnlyDeleteAccess,
  },
  fields: [
    {
      name: 'flag',
      type: 'relationship',
      relationTo: FlagsCollectionSlug,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'comment',
      type: 'textarea',
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
  endpoints: [createComment],
}

export const FlagHistory: CollectionConfig = {
  slug: FlagHistoryCollectionSlug,
  access: {
    read: tenantBasedReadAccess,
    create: authenticatedCreateAccess,
    update: immutableUpdateAccess,
    delete: superAdminOnlyDeleteAccess,
  },
  fields: [
    {
      name: 'flag',
      type: 'relationship',
      relationTo: FlagsCollectionSlug,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'action',
      type: 'select',
      options: [
        { label: 'Created', value: FlagHistoryActionsEnum.CREATED },
        { label: 'Status changed', value: FlagHistoryActionsEnum.STATUS_CHANGED },
        { label: 'Comment', value: FlagHistoryActionsEnum.COMMENT },
      ],
    },
    {
      name: 'prevStatus',
      type: 'select',
      options: flagStatusOptions,
    },
    {
      name: 'newStatus',
      type: 'select',
      options: flagStatusOptions,
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
