import { CollectionConfig } from 'payload'
import { createSocialMedia, patchSocialMedia, updateSocialMediaStatus } from '../endpoints'
import {
  linkedToolsOptions,
  SocialMediaStatusEnum,
  statusLabelMap,
} from '@/features/social-medias/schemas'
import { canReadSocialMedias } from '../access'
import { platformOptions } from '@/features/social-medias/constants/platformOptions'
import { thirdPartyManagementOptions } from '@/features/social-medias/constants/thirdPartyManagementOptions'
import { passwordManagementPracticeOptions } from '@/features/social-medias/constants/passwordManagementPracticeOptions'
import { verificationStatusOptions } from '@/features/social-medias/constants/verificationStatusOptions'

export const SocialMediasCollectionSlug = 'social-medias'

export const SocialMedias: CollectionConfig = {
  slug: SocialMediasCollectionSlug,
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: canReadSocialMedias,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'profileUrl',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'platform',
      type: 'select',
      required: true,
      options: platformOptions,
    },
    {
      name: 'accountHandle',
      type: 'text',
    },
    {
      name: 'businessId',
      type: 'text',
    },
    {
      name: 'adminContactEmails',
      type: 'array',
      fields: [
        {
          name: 'email',
          type: 'email',
        },
      ],
    },
    {
      name: 'backupContactInfo',
      type: 'email',
    },
    {
      name: 'thirdPartyManagement',
      type: 'select',
      options: thirdPartyManagementOptions,
    },
    {
      name: 'thirdPartyProvider',
      type: 'text',
    },
    {
      name: 'thirdPartyContact',
      type: 'text',
    },
    {
      name: 'passwordManagementPractice',
      type: 'select',
      options: passwordManagementPracticeOptions,
    },
    {
      name: 'creationDate',
      type: 'date',
    },
    {
      name: 'linkedTools',
      type: 'select',
      hasMany: true,
      options: linkedToolsOptions,
    },
    {
      name: 'verificationStatus',
      type: 'select',
      options: verificationStatusOptions,
    },
    {
      name: 'platformSupportDetails',
      type: 'text',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'contactEmail',
      type: 'email',
    },
    {
      name: 'contactPhone',
      type: 'text',
    },
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organization',
      required: true,
    },
    {
      name: 'primaryAdmin',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'backupAdmin',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        {
          label: statusLabelMap[SocialMediaStatusEnum.Active],
          value: SocialMediaStatusEnum.Active,
        },
        {
          label: statusLabelMap[SocialMediaStatusEnum.Inactive],
          value: SocialMediaStatusEnum.Inactive,
        },
        {
          label: statusLabelMap[SocialMediaStatusEnum.InTransition],
          value: SocialMediaStatusEnum.InTransition,
        },
        {
          label: statusLabelMap[SocialMediaStatusEnum.PendingApproval],
          value: SocialMediaStatusEnum.PendingApproval,
        },
      ],
      required: true,
    },
    {
      name: 'deactivationReason',
      type: 'text',
    },
    {
      name: 'inactiveFlag',
      type: 'checkbox',
      label: 'Inactive Account',
      admin: {
        description:
          'Automatically set if the account has no public activity for 30+ days and is Active or In Transition.',
      },
      defaultValue: false,
    },
  ],
  timestamps: true,
  endpoints: [createSocialMedia, patchSocialMedia, updateSocialMediaStatus],
}
