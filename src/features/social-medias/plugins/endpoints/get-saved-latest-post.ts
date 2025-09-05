import { z } from 'zod'
import { Endpoint } from 'payload'
import { JSON_HEADERS } from '@/shared/constants'
import { SocialMediaPost } from '@/types/payload-types'

const QuerySchema = z.object({
  socialMediaId: z.coerce.number(),
})

export const getSavedLatestPost: Endpoint = {
  path: '/saved-latest-post',
  method: 'get',
  handler: async (req) => {
    try {
      const { socialMediaId } = QuerySchema.parse(req.query)

      // Find the latest saved post for this social media account
      const savedPost = await req.payload.find({
        collection: 'social-media-posts',
        where: {
          socialMedia: { equals: socialMediaId },
          isLatest: { equals: true },
        },
        limit: 1,
        depth: 0,
      })

      if (savedPost.docs.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No saved latest post found',
            data: null,
          }),
          {
            status: 404,
            headers: JSON_HEADERS,
          },
        )
      }

      const post = savedPost.docs[0] as SocialMediaPost

      // Transform the saved post to match the expected format
      const transformedPost = {
        id: post.externalId,
        platform: post.platform,
        author: post.author,
        author_id: post.authorId || '',
        content: post.content,
        created_at: post.publishedAt,
        url: post.url,
        media_urls: post.mediaUrls || [],
        engagement: post.engagement || {},
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: transformedPost,
          message: 'Saved latest post retrieved successfully',
        }),
        {
          status: 200,
          headers: JSON_HEADERS,
        },
      )
    } catch (err) {
      if (err instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid query parameters',
            error: err.message,
          }),
          {
            status: 400,
            headers: JSON_HEADERS,
          },
        )
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Internal server error',
          error: err instanceof Error ? err.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: JSON_HEADERS,
        },
      )
    }
  },
}
