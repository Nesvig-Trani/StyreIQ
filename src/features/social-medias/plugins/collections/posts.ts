import { CollectionConfig } from 'payload'
import { PlatformEnum } from '../../schemas'

export const SocialMediaPostsCollectionSlug = 'social-media-posts'

export const SocialMediaPosts: CollectionConfig = {
  slug: SocialMediaPostsCollectionSlug,
  admin: {
    useAsTitle: 'content',
    defaultColumns: ['content', 'platform', 'socialMedia', 'createdAt'],
    group: 'Social Media',
  },
  access: {
    read: () => {
      return true
    },
    create: () => {
      return true
    },
    update: () => {
      return true
    },
    delete: () => {
      return false
    },
  },
  fields: [
    {
      name: 'platform',
      type: 'select',
      required: true,
      options: [
        { label: 'YouTube', value: PlatformEnum.YouTube },
        { label: 'Twitter', value: PlatformEnum.Twitter },
        { label: 'Facebook', value: PlatformEnum.Facebook },
        { label: 'Instagram', value: PlatformEnum.Instagram },
        { label: 'LinkedIn', value: PlatformEnum.LinkedIn },
        { label: 'TikTok', value: PlatformEnum.TikTok },
        { label: 'Other', value: PlatformEnum.Other },
      ],
    },
    {
      name: 'socialMedia',
      type: 'relationship',
      relationTo: 'social-medias',
      required: true,
      hasMany: false,
    },
    {
      name: 'externalId',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique identifier from the platform (e.g., tweet ID, video ID)',
      },
    },
    {
      name: 'author',
      type: 'text',
      required: true,
      admin: {
        description: 'Author/creator of the post',
      },
    },
    {
      name: 'authorId',
      type: 'text',
      admin: {
        description: 'Author ID from the platform',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Text content of the post',
      },
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        description: 'Direct link to the post',
      },
    },
    {
      name: 'mediaUrls',
      type: 'array',
      fields: [
        {
          name: 'url',
          type: 'text',
        },
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Image', value: 'image' },
            { label: 'Video', value: 'video' },
            { label: 'Audio', value: 'audio' },
            { label: 'Document', value: 'document' },
            { label: 'Other', value: 'other' },
          ],
        },
      ],
      admin: {
        description: 'Media attachments (images, videos, etc.)',
      },
    },
    {
      name: 'engagement',
      type: 'group',
      fields: [
        {
          name: 'views',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'likes',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'comments',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'shares',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'retweets',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'quotes',
          type: 'number',
          defaultValue: 0,
        },
      ],
      admin: {
        description: 'Engagement metrics from the platform',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      admin: {
        description: 'When the post was published on the platform',
      },
    },
    {
      name: 'scrapedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
      admin: {
        description: 'When this post was scraped and stored',
      },
    },
    {
      name: 'isLatest',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Indicates if this is the most recent post from the account',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional platform-specific metadata',
      },
    },
  ],
  timestamps: true,
}
