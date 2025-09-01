import { z } from 'zod'
import { EndpointError } from '@/shared'
import { Endpoint } from 'payload'
import { JSON_HEADERS } from '@/shared/constants'
import {
  TwitterLatestPostResponseSchema,
  YoutubeLatestPostResponseSchema,
} from '../../schemas/latest-posts.schema'
import { PlatformEnum } from '../../schemas'
import { env } from '@/config/env'

const QuerySchema = z.object({
  channel: z.string().min(1),
  platform: z.enum([PlatformEnum.YouTube, PlatformEnum.Twitter]),
})

const platformSchemas = {
  youtube: YoutubeLatestPostResponseSchema,
  twitter: TwitterLatestPostResponseSchema,
} as const

export const scrapLatestPost: Endpoint = {
  path: '/latest-post',
  method: 'get',
  handler: async (req) => {
    try {
      const { channel, platform } = QuerySchema.parse(req.query)

      const url = new URL(
        `/api/v1/posts/${platform}/${channel}/latest`,
        env.BASE_SOCIAL_MEDIA_API_URL,
      )

      const latestPostResponse = await fetch(url.toString(), {
        method: 'GET',
        headers: JSON_HEADERS,
      })

      if (!latestPostResponse.ok) {
        throw new EndpointError('No latest post found', 404)
      }

      const json = await latestPostResponse.json()

      const schema = platformSchemas[platform]
      const latestPost = schema.parse(json)

      // TODO: store the latest post in the db

      return new Response(JSON.stringify(latestPost), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (err) {
      console.error('Error fetching latest post:', err)

      if (err instanceof z.ZodError) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 400,
          headers: JSON_HEADERS,
        })
      }

      if (err instanceof EndpointError) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: err.code,
          headers: JSON_HEADERS,
        })
      }

      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: err instanceof Error ? err.message : String(err),
        }),
        {
          status: 500,
          headers: JSON_HEADERS,
        },
      )
    }
  },
}
