import { CollectionConfig, Where } from 'payload'
import { createSocialMedia, patchSocialMedia, updateSocialMediaStatus } from '../endpoints'
import {
  linkedToolsOptions,
  SocialMediaStatusEnum,
  statusLabelMap,
} from '@/features/social-medias/schemas'
import { platformOptions } from '@/features/social-medias/constants/platformOptions'
import { thirdPartyManagementOptions } from '@/features/social-medias/constants/thirdPartyManagementOptions'
import { passwordManagementPracticeOptions } from '@/features/social-medias/constants/passwordManagementPracticeOptions'
import { verificationStatusOptions } from '@/features/social-medias/constants/verificationStatusOptions'
import { scrapLatestPost } from '../endpoints/get-and-store-latest-post'
import { SocialMediaPosts, SocialMediaPostsCollectionSlug } from './posts'
import { getSavedLatestPost } from '../endpoints/get-saved-latest-post'
import { injectTenantHook } from '@/features/tenants/hooks/inject-tenant'
import { UserRolesEnum } from '@/features/users'
import { getAccessibleOrgIdsForUserWithPayload } from '@/shared'
import {
  tenantValidatedDeleteAccess,
  tenantValidatedUpdateAccess,
} from '@/features/tenants/plugins/collections/helpers/access-control-helpers'

export const SocialMediasCollectionSlug = 'social-medias'

export { SocialMediaPosts, SocialMediaPostsCollectionSlug }

export const SocialMedias: CollectionConfig = {
  slug: SocialMediasCollectionSlug,
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: async ({ req }): Promise<boolean | Where> => {
      const { user, payload } = req
      if (!user) return false

      const { role, tenant, id } = user

      if (role === UserRolesEnum.SuperAdmin) return true
      if (!tenant) return false

      switch (role) {
        case UserRolesEnum.CentralAdmin:
          return { tenant: { equals: tenant } }

        case UserRolesEnum.UnitAdmin: {
          const accessibleOrgIds = await getAccessibleOrgIdsForUserWithPayload(user, payload)
          return {
            and: [{ tenant: { equals: tenant } }, { organization: { in: accessibleOrgIds } }],
          }
        }

        case UserRolesEnum.SocialMediaManager:
          return {
            and: [
              { tenant: { equals: tenant } },
              {
                or: [
                  { socialMediaManagers: { contains: id } },
                  { primaryAdmin: { equals: id } },
                  { backupAdmin: { equals: id } },
                ],
              },
            ],
          }

        default:
          return false
      }
    },

    create: async ({ req, data }) => {
      const { user, payload } = req
      if (!user) return false

      const { role, tenant } = user

      if (role === UserRolesEnum.SuperAdmin) return true
      if (!tenant) return false

      if (data?.tenant && data.tenant !== tenant) return false

      switch (role) {
        case UserRolesEnum.CentralAdmin:
          return true

        case UserRolesEnum.UnitAdmin: {
          if (!data?.organization) return false

          const accessibleOrgIds = await getAccessibleOrgIdsForUserWithPayload(user, payload)
          const orgId =
            typeof data.organization === 'object' ? data.organization.id : data.organization

          return accessibleOrgIds.includes(Number(orgId))
        }

        default:
          return false
      }
    },

    update: tenantValidatedUpdateAccess(SocialMediasCollectionSlug),
    delete: tenantValidatedDeleteAccess(SocialMediasCollectionSlug),
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
      name: 'socialMediaManagers',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
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
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'update' && data.tenant) {
          const existing = await req.payload.findByID({
            collection: SocialMediasCollectionSlug,
            id: data.id,
          })

          if (existing && existing.tenant !== data.tenant) {
            throw new Error('Cannot change tenant assignment after social media creation')
          }
        }

        if (data.organization && data.tenant) {
          const org = await req.payload.findByID({
            collection: 'organization',
            id: typeof data.organization === 'object' ? data.organization.id : data.organization,
          })

          if (org && org.tenant !== data.tenant) {
            throw new Error('Organization must belong to the same tenant')
          }
        }

        return data
      },
    ],
  },
  timestamps: true,
  endpoints: [
    createSocialMedia,
    scrapLatestPost,
    patchSocialMedia,
    updateSocialMediaStatus,
    getSavedLatestPost,
  ],
}
