import { CollectionConfig } from 'payload'
import { AcknowledgmentsCollectionSlug, PoliciesCollectionSlug } from '@/policies/schemas'
import { getLastPolicyVersion } from '../queries'

export const Policies: CollectionConfig = {
  slug: PoliciesCollectionSlug,
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (!req.user) return
        if (operation !== 'create') return
        const lastPolicy = await getLastPolicyVersion()
        return {
          ...data,
          version:
            lastPolicy && lastPolicy.version
              ? Math.round((lastPolicy?.version + 0.1) * 10) / 10
              : 0.1,
          author: req.user.id,
        }
      },
    ],
  },
  fields: [
    {
      name: 'version',
      type: 'number',
      unique: true,
      defaultValue: 0.1,
    },
    {
      name: 'text',
      type: 'richText',
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}

export const Acknowledgments: CollectionConfig = {
  slug: AcknowledgmentsCollectionSlug,
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (!req.user) return
        if (operation !== 'create') return
        return {
          ...data,
          user: req.user.id,
        }
      },
    ],
  },

  fields: [
    {
      name: 'policy',
      type: 'relationship',
      relationTo: PoliciesCollectionSlug,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}
