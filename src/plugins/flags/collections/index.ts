import type { CollectionConfig } from 'payload'
import {
  FlagCommentsCollectionSlug,
  FlagHistoryCollectionSlug,
  FlagsCollectionSlug,
} from '@/plugins/flags/types'
import { createComment, createFlag, markAsResolved } from '../endpoints'
import { FlagHistoryActionsEnum, FlagSourceEnum } from '@/flags/schemas'
import { canReadFlags } from '../access'
import { flagStatusOptions } from '@/flags/constants/flagStatusOptions'

export const Flags: CollectionConfig = {
  slug: FlagsCollectionSlug,
  access: {
    read: canReadFlags,
  },
  fields: [
    {
      name: 'flagType',
      type: 'text',
    },
    {
      name: 'affectedEntity',
      type: 'relationship',
      relationTo: ['users', 'social-medias'],
    },
    {
      name: 'organizations',
      type: 'relationship',
      relationTo: 'organization',
      hasMany: true,
    },
    {
      name: 'status',
      type: 'select',
      options: flagStatusOptions,
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
  ],
  endpoints: [createFlag, markAsResolved],
}

export const FlagComments: CollectionConfig = {
  slug: FlagCommentsCollectionSlug,
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
  ],
  endpoints: [createComment],
}

export const FlagHistory: CollectionConfig = {
  slug: FlagHistoryCollectionSlug,
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
  ],
}
