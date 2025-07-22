import { CollectionConfig } from 'payload'
import {
  createSocialMedia,
  patchSocialMedia,
  updateSocialMediaStatus,
} from '@/plugins/social-medias/endpoints'
import { SocialMediaStatusEnum, statusLabelMap } from '@/social-medias/schemas'
import { canReadSocialMedias } from '../access'

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
      type: 'text',
      required: true,
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
