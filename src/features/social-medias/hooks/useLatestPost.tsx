'use client'
import { useCallback, useEffect, useState } from 'react'
import { TwitterLatestPost, YoutubeLatestPost } from '../schemas/latest-posts.schema'
import { getLatestPost } from '../sdk/get-latest-post.sdk'
import { getSavedLatestPost } from '../sdk/get-saved-latest-post.sdk'

export const useLatestPost = (
  platform: string,
  channelIdentifier: string,
  socialMediaId: number,
) => {
  const [latestPost, setLatestPost] = useState<YoutubeLatestPost | TwitterLatestPost | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean | null>(null)

  const getAndSaveLatesPost = useCallback(() => {
    setLoading(true)
    console.log('Fetching latest post for', platform, channelIdentifier)
    getLatestPost({ channel: channelIdentifier, platform, socialMediaId })
      .then((response) => {
        console.log('Latest post response:', response)
        setLatestPost(response.data)
        setSuccess(true)
        setError(null)
      })
      .catch((err) => {
        console.error('Error fetching latest post:', err)
        setError(err.message)
        setSuccess(false)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [platform, channelIdentifier, socialMediaId])

  const getSavedLatestPostData = useCallback(() => {
    setLoading(true)
    console.log('Fetching saved latest post for social media ID:', socialMediaId)
    getSavedLatestPost({ socialMediaId })
      .then((response) => {
        console.log('Saved latest post response:', response)
        if (response.success && response.data) {
          setLatestPost(response.data)
          setSuccess(true)
          setError(null)
        } else {
          setError(response.message || 'No saved post found')
          setSuccess(false)
        }
      })
      .catch((err) => {
        console.error('Error fetching saved latest post:', err)
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [socialMediaId])

  useEffect(() => {
    getSavedLatestPostData()
  }, [getSavedLatestPostData])

  return { latestPost, loading, error, success, getAndSaveLatesPost, getSavedLatestPostData }
}
