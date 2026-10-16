import { describe, expect, it } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildSocialMediaPost } from '../fixtures'
import {
  storeSocialMediaPost,
  transformTwitterPost,
  transformYoutubePost,
} from '../../utils/post-storage'
import type { TwitterLatestPost, YoutubeLatestPost } from '../../schemas/latest-posts.schema'

const youtubePost: YoutubeLatestPost = {
  id: 'dQw4w9WgXcQ',
  platform: 'youtube',
  author: 'Universidad Andina',
  author_id: 'UC-andina-canal',
  content: 'Ceremonia de grados 2026',
  created_at: new Date('2026-09-18T10:00:00.000Z'),
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  media_urls: ['https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg'],
  engagement: { views: 1200, likes: 85, comments: 14 },
}

const twitterPost: TwitterLatestPost = {
  id: '1840211223344',
  platform: 'twitter',
  author: 'Universidad Andina',
  author_id: 'uandina_oficial',
  content: 'Abrimos inscripciones para el semestre 2027-1',
  created_at: new Date('2026-09-20T15:00:00.000Z'),
  url: 'https://x.com/uandina_oficial/status/1840211223344',
  media_urls: ['https://pbs.twimg.com/media/afiche.jpg'],
  engagement: { likes: 40, retweets: 12, replies: 6, quotes: 3 },
}

describe('transformYoutubePost', () => {
  it('should map the YouTube payload to the stored post shape', () => {
    const post = transformYoutubePost(youtubePost)

    expect(post).toMatchObject({
      platform: 'youtube',
      externalId: 'dQw4w9WgXcQ',
      authorId: 'UC-andina-canal',
      publishedAt: '2026-09-18T10:00:00.000Z',
      mediaUrls: [{ url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg', type: 'other' }],
      engagement: { views: 1200, likes: 85, comments: 14, shares: 0, retweets: 0, quotes: 0 },
    })
  })
})

describe('transformTwitterPost', () => {
  it('should map replies to comments and keep retweets and quotes', () => {
    const post = transformTwitterPost(twitterPost)

    expect(post).toMatchObject({
      platform: 'twitter',
      externalId: '1840211223344',
      publishedAt: '2026-09-20T15:00:00.000Z',
      engagement: { views: 0, likes: 40, comments: 6, shares: 0, retweets: 12, quotes: 3 },
    })
  })
})

describe('storeSocialMediaPost', () => {
  const postData = transformTwitterPost(twitterPost)

  it('should create the post when its external id is new', async () => {
    const payload = createFakePayload()

    await storeSocialMediaPost(payload.asPayload(), postData, 7)

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'social-media-posts',
        data: expect.objectContaining({
          socialMedia: 7,
          externalId: '1840211223344',
          isLatest: true,
        }),
      }),
    )
  })

  it('should update the existing post instead of duplicating it', async () => {
    const payload = createFakePayload()
    payload.find.mockResolvedValue({ docs: [buildSocialMediaPost({ id: 55 })], totalDocs: 1 })

    await storeSocialMediaPost(payload.asPayload(), postData, 7)

    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 55, collection: 'social-media-posts' }),
    )
  })

  it('should unflag older latest posts of the account and flag the new one', async () => {
    const payload = createFakePayload()

    await storeSocialMediaPost(payload.asPayload(), postData, 7)

    const updates = payload.update.mock.calls.map(([args]) => args)
    expect(updates[0]).toMatchObject({
      where: { socialMedia: { equals: 7 }, isLatest: { equals: true } },
      data: { isLatest: false },
    })
    expect(updates[1]).toMatchObject({
      where: { externalId: { equals: '1840211223344' }, socialMedia: { equals: 7 } },
      data: { isLatest: true },
    })
  })

  it('should propagate database errors to the caller', async () => {
    const payload = createFakePayload()
    payload.find.mockRejectedValue(new Error('db unavailable'))

    await expect(storeSocialMediaPost(payload.asPayload(), postData, 7)).rejects.toThrow(
      'db unavailable',
    )
  })
})
