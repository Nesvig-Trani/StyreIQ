'use client'
import { useEffect, useState } from 'react'
import { YoutubeLatestPost } from '../schemas/latest-posts.schema'
import { getLatestPost } from '../sdk/get-latest-post.sdk'

export const useLatestPost = (platform: string, channelIdentifier: string) => {
  const [latestPost, setLatestPost] = useState<YoutubeLatestPost | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    console.log('Fetching latest post for', platform, channelIdentifier)
    getLatestPost({ channel: channelIdentifier, platform })
      .then((response) => {
        console.log('Latest post response:', response)
        setLatestPost(response.data)
      })
      .catch((err) => {
        console.error('Error fetching latest post:', err)
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [platform, channelIdentifier])

  return { latestPost, loading, error }
}
