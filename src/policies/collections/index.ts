import { CollectionConfig } from 'payload'
import { AcknowledgmentsCollectionSlug, PoliciesCollectionSlug } from '../schemas'

export const Policies: CollectionConfig = {
  slug: PoliciesCollectionSlug,
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        console.log('this happens')
        if (!req.user) return
        if (operation !== 'create') return
        const lastVersion = await req.payload.find({
          collection: 'policies',
          sort: '-version',
          limit: 1,
        })
        console.log('lastVersion', lastVersion)
        const lastPolicy = lastVersion.docs[0]
        console.log('original', data)

        return {
          ...data,
          version: lastPolicy && lastPolicy.version ? lastPolicy?.version + 0.1 : 0.1,
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
        console.log("data", data)
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
