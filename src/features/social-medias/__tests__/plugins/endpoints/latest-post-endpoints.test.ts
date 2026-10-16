// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakePayload, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildSocialMediaPost } from '../../fixtures'
import { scrapLatestPost } from '../../../plugins/endpoints/get-and-store-latest-post'
import { getSavedLatestPost } from '../../../plugins/endpoints/get-saved-latest-post'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const twitterApiBody = {
  success: true,
  message: 'ok',
  data: {
    id: '1840211223344',
    platform: 'twitter',
    author: 'Universidad Andina',
    author_id: 'uandina_oficial',
    content: 'Abrimos inscripciones para el semestre 2027-1',
    created_at: '2026-09-20T15:00:00.000Z',
    url: 'https://x.com/uandina_oficial/status/1840211223344',
    media_urls: [],
    engagement: { likes: 40, retweets: 12, replies: 6, quotes: 3 },
  },
}

const youtubeApiBody = {
  success: true,
  message: 'ok',
  data: {
    id: 'dQw4w9WgXcQ',
    platform: 'youtube',
    author: 'Universidad Andina',
    author_id: 'UC-andina-canal',
    content: 'Ceremonia de grados 2026',
    created_at: '2026-09-18T10:00:00.000Z',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    media_urls: [],
    engagement: { views: 1200, likes: 85, comments: 14 },
  },
}

describe('scrapLatestPost endpoint', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('should return 400 when the query is missing the channel', async () => {
    const { asRequest } = createFakeRequest({
      query: { platform: 'twitter', socialMediaId: '7' },
    })

    const response = await scrapLatestPost.handler(asRequest())

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should return 400 when the platform is not supported for scraping', async () => {
    const { asRequest } = createFakeRequest({
      query: { channel: 'uandina_oficial', platform: 'instagram', socialMediaId: '7' },
    })

    expect((await scrapLatestPost.handler(asRequest())).status).toBe(400)
  })

  it('should return 404 when the social API has no latest post', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 404))
    const { asRequest } = createFakeRequest({
      query: { channel: 'uandina_oficial', platform: 'twitter', socialMediaId: '7' },
    })

    const response = await scrapLatestPost.handler(asRequest())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'No latest post found' })
  })

  it('should request the platform URL and store the tweet it returns', async () => {
    fetchMock.mockResolvedValue(jsonResponse(twitterApiBody))
    const payload = createFakePayload()
    const { asRequest } = createFakeRequest({
      payload,
      query: { channel: 'uandina_oficial', platform: 'twitter', socialMediaId: '7' },
    })

    const response = await scrapLatestPost.handler(asRequest())

    expect(response.status).toBe(200)
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://social-api.styreiq.test/api/v1/posts/twitter/uandina_oficial/latest',
    )
    expect((await response.json()).data.id).toBe('1840211223344')
    await vi.waitFor(() =>
      expect(payload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ platform: 'twitter', socialMedia: 7 }),
        }),
      ),
    )
  })

  it('should store the YouTube video it returns', async () => {
    fetchMock.mockResolvedValue(jsonResponse(youtubeApiBody))
    const payload = createFakePayload()
    const { asRequest } = createFakeRequest({
      payload,
      query: { channel: 'UC-andina-canal', platform: 'youtube', socialMediaId: '8' },
    })

    const response = await scrapLatestPost.handler(asRequest())

    expect(response.status).toBe(200)
    await vi.waitFor(() =>
      expect(payload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ platform: 'youtube', externalId: 'dQw4w9WgXcQ' }),
        }),
      ),
    )
  })

  it('should return 400 when the social API answers with an unexpected shape', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, message: 'ok', data: {} }))
    const { asRequest } = createFakeRequest({
      query: { channel: 'uandina_oficial', platform: 'twitter', socialMediaId: '7' },
    })

    expect((await scrapLatestPost.handler(asRequest())).status).toBe(400)
  })

  it('should return 500 with the error message when the API call throws', async () => {
    fetchMock.mockRejectedValue(new Error('socket hang up'))
    const { asRequest } = createFakeRequest({
      query: { channel: 'uandina_oficial', platform: 'twitter', socialMediaId: '7' },
    })

    const response = await scrapLatestPost.handler(asRequest())

    expect(response.status).toBe(500)
    expect(await response.json()).toMatchObject({
      error: 'Internal Server Error',
      message: 'socket hang up',
    })
  })
})

describe('getSavedLatestPost endpoint', () => {
  it('should return 400 when the account id is not numeric', async () => {
    const { asRequest } = createFakeRequest({ query: { socialMediaId: 'abc' } })

    const response = await getSavedLatestPost.handler(asRequest())

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      success: false,
      message: 'Invalid query parameters',
    })
  })

  it('should return 404 when no post is flagged as latest', async () => {
    const { asRequest } = createFakeRequest({ query: { socialMediaId: '7' } })

    const response = await getSavedLatestPost.handler(asRequest())

    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ success: false, data: null })
  })

  it('should return the saved post transformed to the API shape', async () => {
    const payload = createFakePayload()
    payload.find.mockResolvedValue({
      docs: [
        buildSocialMediaPost({
          mediaUrls: [{ url: 'https://pbs.twimg.com/media/afiche.jpg', type: 'image' }],
          engagement: { likes: 40 },
        }),
      ],
      totalDocs: 1,
    })
    const { asRequest } = createFakeRequest({ payload, query: { socialMediaId: '7' } })

    const response = await getSavedLatestPost.handler(asRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      message: 'Saved latest post retrieved successfully',
      data: {
        id: '1840211223344',
        platform: 'twitter',
        author: 'Universidad Andina',
        author_id: 'uandina_oficial',
        content: 'Abrimos inscripciones para el semestre 2027-1',
        created_at: '2026-09-20T15:00:00.000Z',
        url: 'https://x.com/uandina_oficial/status/1840211223344',
        media_urls: ['https://pbs.twimg.com/media/afiche.jpg'],
        engagement: { likes: 40 },
      },
    })
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { socialMedia: { equals: 7 }, isLatest: { equals: true } },
      }),
    )
  })

  it('should fall back to empty author id, media and engagement when absent', async () => {
    const payload = createFakePayload()
    payload.find.mockResolvedValue({
      docs: [buildSocialMediaPost({ authorId: null, mediaUrls: null, engagement: undefined })],
      totalDocs: 1,
    })
    const { asRequest } = createFakeRequest({ payload, query: { socialMediaId: '7' } })

    const body = await (await getSavedLatestPost.handler(asRequest())).json()

    expect(body.data).toMatchObject({ author_id: '', media_urls: [], engagement: {} })
  })

  it('should return 500 when the database query fails', async () => {
    const payload = createFakePayload()
    payload.find.mockRejectedValue(new Error('db unavailable'))
    const { asRequest } = createFakeRequest({ payload, query: { socialMediaId: '7' } })

    const response = await getSavedLatestPost.handler(asRequest())

    expect(response.status).toBe(500)
    expect(await response.json()).toMatchObject({ error: 'db unavailable' })
  })
})
