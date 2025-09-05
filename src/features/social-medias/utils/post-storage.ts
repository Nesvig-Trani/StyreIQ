import { Payload } from 'payload'
import { PlatformEnum } from '../schemas'
import { SocialMediaPost } from '@/types/payload-types'
import type { TwitterLatestPost, YoutubeLatestPost } from '../schemas/latest-posts.schema'

export interface PostData {
  platform: PlatformEnum
  socialMediaId: number
  author: string
  authorId: string
  content: string
  url: string
  mediaUrls: Array<{ url: string; type: string }>
  engagement: {
    views: number
    likes: number
    comments: number
    shares: number
    retweets: number
    quotes: number
  }
  publishedAt: Date
}

export const storeSocialMediaPost = async (
  payload: Payload,
  postData: Omit<SocialMediaPost, 'socialMedia' | 'id'>,
  socialMediaId: number,
): Promise<void> => {
  try {
    // Check if a post with this external ID already exists
    const existingPost = await payload.find({
      collection: 'social-media-posts',
      where: {
        externalId: { equals: postData.externalId },
      },
      limit: 1,
    })

    if (existingPost.docs.length > 0) {
      // Update existing post
      await payload.update({
        collection: 'social-media-posts',
        id: existingPost.docs[0].id,
        data: {
          content: postData.content,
          url: postData.url,
          mediaUrls: postData.mediaUrls,
          engagement: postData.engagement,
          publishedAt: postData.publishedAt,
          scrapedAt: new Date().toISOString(),
          isLatest: true,
        },
      })
    } else {
      // Create new post
      await payload.create({
        collection: 'social-media-posts',
        data: {
          platform: postData.platform,
          socialMedia: socialMediaId,
          externalId: postData.externalId,
          author: postData.author,
          authorId: postData.authorId,
          content: postData.content,
          url: postData.url,
          mediaUrls: postData.mediaUrls,
          engagement: postData.engagement,
          publishedAt: postData.publishedAt,
          scrapedAt: new Date().toISOString(),
          isLatest: true,
        },
      })
    }

    // Update all other posts from this social media account to not be latest
    await payload.update({
      collection: 'social-media-posts',
      where: {
        socialMedia: { equals: socialMediaId },
        isLatest: { equals: true },
      },
      data: {
        isLatest: false,
      },
    })

    // Set the new post as latest
    await payload.update({
      collection: 'social-media-posts',
      where: {
        externalId: { equals: postData.externalId },
        socialMedia: { equals: socialMediaId },
      },
      data: {
        isLatest: true,
      },
    })
  } catch (error) {
    throw error
  }
}

export const transformYoutubePost = (
  youtubePost: YoutubeLatestPost,
): Omit<SocialMediaPost, 'socialMedia' | 'id'> => ({
  platform: PlatformEnum.YouTube,
  externalId: youtubePost.id,
  author: youtubePost.author,
  authorId: youtubePost.author_id,
  content: youtubePost.content,
  url: youtubePost.url,
  mediaUrls: youtubePost.media_urls.map((url) => ({ url, type: 'other' })),
  engagement: {
    views: youtubePost.engagement.views,
    likes: youtubePost.engagement.likes,
    comments: youtubePost.engagement.comments,
    shares: 0,
    retweets: 0,
    quotes: 0,
  },
  publishedAt: youtubePost.created_at.toISOString(),
  scrapedAt: new Date().toISOString(),
  createdAt: new Date().toDateString(),
  updatedAt: new Date().toISOString(),
})

export const transformTwitterPost = (
  twitterPost: TwitterLatestPost,
): Omit<SocialMediaPost, 'socialMedia' | 'id'> => ({
  platform: PlatformEnum.Twitter,
  externalId: twitterPost.id,
  author: twitterPost.author,
  authorId: twitterPost.author_id,
  content: twitterPost.content,
  url: twitterPost.url,
  mediaUrls: twitterPost.media_urls.map((url) => ({ url, type: 'other' })),
  engagement: {
    views: 0,
    likes: twitterPost.engagement.likes,
    comments: twitterPost.engagement.replies,
    shares: 0,
    retweets: twitterPost.engagement.retweets,
    quotes: twitterPost.engagement.quotes,
  },
  publishedAt: twitterPost.created_at.toISOString(),
  scrapedAt: new Date().toISOString(),
  createdAt: new Date().toDateString(),
  updatedAt: new Date().toISOString(),
})
