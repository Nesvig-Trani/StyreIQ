import { CollectionConfig } from 'payload'
import { createSocialMedia, patchSocialMedia } from '@/social-medias/endpoints'
import { SocialMediaStatusEnum, statusLabelMap } from '@/social-medias/schemas'

export const SocialMediasCollectionSlug = 'social-medias'

export const SocialMedias: CollectionConfig = {
  slug: SocialMediasCollectionSlug,
  admin: {
    useAsTitle: 'name',
  },
  access: {},
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
      name: 'passwordUpdatedAt',
      type: 'date',
    },
    {
      name: 'isEnabledTwoFactor',
      type: 'checkbox',
    },
    {
      name: 'isInUseSecurePassword',
      type: 'checkbox',
    },
    {
      name: 'isAcceptedPolicies',
      type: 'checkbox',
    },
    {
      name: 'isCompletedTrainingAccessibility',
      type: 'checkbox',
    },
    {
      name: 'isCompletedTrainingRisk',
      type: 'checkbox',
    },
    {
      name: 'isCompletedTrainingBrand',
      type: 'checkbox',
    },
    {
      name: 'hasKnowledgeStandards',
      type: 'checkbox',
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
  ],
  timestamps: true,
  endpoints: [createSocialMedia, patchSocialMedia],
}
