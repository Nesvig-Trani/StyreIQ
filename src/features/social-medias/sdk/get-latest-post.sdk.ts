import { env } from '@/config/env'
import { JSON_HEADERS } from '@/shared/constants'

interface GetLatestPostParams {
  channel: string
  platform: string
  socialMediaId: number
}

export const getLatestPost = async ({ channel, platform, socialMediaId }: GetLatestPostParams) => {
  const url = new URL('/api/social-medias/latest-post', env.NEXT_PUBLIC_BASE_URL)
  url.searchParams.set('channel', channel)
  url.searchParams.set('platform', platform)
  url.searchParams.set('socialMediaId', socialMediaId.toString())

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: JSON_HEADERS,
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch the latest post')
  }

  return response.json()
}
