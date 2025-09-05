import { env } from '@/config/env'
import { JSON_HEADERS } from '@/shared/constants'

interface GetSavedLatestPostParams {
  socialMediaId: number
}

export const getSavedLatestPost = async ({ socialMediaId }: GetSavedLatestPostParams) => {
  const url = new URL('/api/social-medias/saved-latest-post', env.NEXT_PUBLIC_BASE_URL)
  url.searchParams.set('socialMediaId', socialMediaId.toString())

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: JSON_HEADERS,
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch the saved latest post')
  }

  return response.json()
}
