import { CollectionConfig } from 'payload'
import { AcknowledgmentsCollectionSlug, PoliciesCollectionSlug } from '@/features/policies/schemas'
import { getLastPolicyVersion } from '../queries'

export const Policies: CollectionConfig = {
  slug: PoliciesCollectionSlug,
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (!req.user) return
        if (operation !== 'create') return
        const lastPolicy = await getLastPolicyVersion()
        await req.payload.update({
          collection: 'users',
          where: {},
          data: {
            date_of_last_policy_review: new Date().toISOString(),
            admin_policy_agreement: false,
          },
        })
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
        await req.payload.update({
          collection: 'users',
          where: { id: { equals: req.user.id } },
          data: {
            date_of_last_policy_review: new Date().toISOString(),
            admin_policy_agreement: true,
          },
        })

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
