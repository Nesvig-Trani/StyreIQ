/* eslint-disable @next/next/no-img-element */
import { useLatestPost } from '@/features/social-medias/hooks/useLatestPost'
import { PlatformEnum, platformLabelMap } from '@/features/social-medias/schemas'
import { Badge, Button } from '@/shared'
import { InfoCard } from '@/shared/components/ui/info-card'
import { formatDistanceToNow } from 'date-fns'
import {
  Eye,
  Heart,
  MessageCircle,
  MessageSquare,
  Share2,
  SquareArrowOutUpRight,
} from 'lucide-react'

const icons = {
  [PlatformEnum.Facebook]: '🔵',
  [PlatformEnum.Instagram]: '🟣',
  [PlatformEnum.Twitter]: '🔵',
  [PlatformEnum.YouTube]: '🔴',
  [PlatformEnum.TikTok]: '⚫',
  [PlatformEnum.LinkedIn]: '🔵',
  [PlatformEnum.Other]: '⚪',
}

const getPlatformIcon = (platform: string) => {
  return icons[platform as keyof typeof icons] || '⚪'
}

const allowedPlatforms = ['youtube', 'twitter']

interface Props {
  platform: string
  channelId: string
  socialMediaId: number
}

export const LatestPost = ({ platform, channelId, socialMediaId }: Props) => {
  const { loading, latestPost, error, success, getAndSaveLatesPost, getSavedLatestPostData } =
    useLatestPost(platform, channelId, socialMediaId)
  const platformIcon = getPlatformIcon(platform)
  const platformLabel = platformLabelMap[platform as PlatformEnum] || platform

  if (
    !loading &&
    latestPost === null &&
    error !== 'No saved latest post found' &&
    success === false
  ) {
    return <div className="text-red-600 text-sm mt-2">Error loading latest post</div>
  }

  // TODO handle other platforms
  if (!allowedPlatforms.includes(platform)) {
    return (
      <div>
        <InfoCard
          icon={<MessageSquare className="h-4 w-4 text-black" />}
          title="Latest Post"
          className="w-full"
        >
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Latest post preview is only available for YouTube and Twitter accounts. Stay tunned for
            more platforms!
          </p>
        </InfoCard>
      </div>
    )
  }

  return (
    <InfoCard
      icon={<MessageSquare className="h-4 w-4 text-black" />}
      title="Latest Post"
      className="w-full"
      action={
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              getSavedLatestPostData()
            }}
          >
            Load saved post
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              getAndSaveLatesPost()
            }}
          >
            Get latest post
          </Button>
        </div>
      }
    >
      {loading && (
        <div>
          <p>Loading latest post...</p>
        </div>
      )}

      {!loading && latestPost && (
        <div className="space-y-4">
          {/* Header with Platform and User Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{platformIcon}</span>
                <Badge variant="outline">{platformLabel}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">•</span>
              {latestPost?.created_at && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(latestPost?.created_at, { addSuffix: true })}
                </span>
              )}
            </div>
            <a
              href={latestPost?.media_urls[0] || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
            >
              View on {platformLabel}
              <SquareArrowOutUpRight className="h-3 w-3" />
            </a>
          </div>

          {/* User Information */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-sm">{latestPost?.author}</div>
            </div>
          </div>

          {/* Post Content and Media */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Content */}
            <div className="lg:col-span-2">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{latestPost?.content}</p>

                {/* Engagement Metrics */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t">
                  {Object.entries(latestPost?.engagement || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-1">
                      {key === 'likes' && <Heart className="h-3 w-3" />}
                      {key === 'comments' && <MessageCircle className="h-3 w-3" />}
                      {key === 'shares' && <Share2 className="h-3 w-3" />}
                      {key === 'views' && <Eye className="h-3 w-3" />}
                      {key === 'retweets' && <Share2 className="h-3 w-3" />}
                      {key === 'reactions' && <Heart className="h-3 w-3" />}
                      {key === 'saves' && <MessageSquare className="h-3 w-3" />}
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Media Thumbnail */}
            <div className="lg:col-span-1">
              <div className="relative group cursor-pointer">
                <img
                  src={
                    latestPost?.media_urls[0] ||
                    'https://static.vecteezy.com/system/resources/thumbnails/004/141/669/small_2x/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg'
                  }
                  alt={latestPost?.id || 'Latest Post Media'}
                  className="w-full h-48 object-cover rounded-lg border"
                />
                {latestPost?.platform === 'youtube' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black bg-opacity-50 rounded-full p-3">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && error === 'Failed to fetch the saved latest post' && (
        <div className="text-sm text-red-600">
          No saved latest post found, please get the latest post
        </div>
      )}
    </InfoCard>
  )
}
