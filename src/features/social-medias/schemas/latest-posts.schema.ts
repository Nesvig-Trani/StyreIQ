import { z } from 'zod'

// YouTube Schemas
export const EngagementSchema = z.object({
  views: z.number(),
  likes: z.number(),
  comments: z.number(),
})
export type Engagement = z.infer<typeof EngagementSchema>

export const YoutubeLatestPost = z.object({
  id: z.string(),
  platform: z.string(),
  author: z.string(),
  author_id: z.string(),
  content: z.string(),
  created_at: z.coerce.date(),
  url: z.string(),
  media_urls: z.array(z.string()),
  engagement: EngagementSchema,
})
export type YoutubeLatestPost = z.infer<typeof YoutubeLatestPost>

export const YoutubeLatestPostResponseSchema = z.object({
  success: z.boolean(),
  data: YoutubeLatestPost,
  message: z.string(),
})
export type YoutubeLatestPostResponse = z.infer<typeof YoutubeLatestPostResponseSchema>

// Twitter Schemas
export const TwitterEngagementSchema = z.object({
  likes: z.number(),
  retweets: z.number(),
  replies: z.number(),
  quotes: z.number(),
})
export type TwitterEngagement = z.infer<typeof TwitterEngagementSchema>

export const TwitterLatestPost = z.object({
  id: z.string(),
  platform: z.string(),
  author: z.string(),
  author_id: z.string(),
  content: z.string(),
  created_at: z.coerce.date(),
  url: z.string(),
  media_urls: z.array(z.any()),
  engagement: TwitterEngagementSchema,
})
export type Data = z.infer<typeof TwitterLatestPost>

export const TwitterLatestPostResponseSchema = z.object({
  success: z.boolean(),
  data: TwitterLatestPost,
  message: z.string(),
})
export type TwitterLatestPostResponse = z.infer<typeof TwitterLatestPostResponseSchema>
