import { CollectionConfig } from 'payload'
import { WelcomeEmailCollectionSlug } from '../types'

export const WelcomeEmails: CollectionConfig = {
  slug: WelcomeEmailCollectionSlug,
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
  ],
}
