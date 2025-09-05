# Social Media Posts Collection

This feature adds a new collection to store social media posts that are scraped from various platforms.

## Overview

The `social-media-posts` collection stores posts from social media accounts with the following features:

- **One-to-many relationship**: One social media account can have many posts
- **Platform support**: Supports YouTube, Twitter, Facebook, Instagram, LinkedIn, TikTok, and other platforms
- **Engagement tracking**: Stores likes, views, comments, shares, retweets, and quotes
- **Media attachments**: Supports images, videos, audio, and documents
- **Latest post tracking**: Automatically marks the most recent post as "latest"

## Collection Structure

### Fields

- `platform`: The social media platform (YouTube, Twitter, etc.)
- `socialMedia`: Relationship to the social media account
- `externalId`: Unique identifier from the platform (e.g., tweet ID, video ID)
- `author`: Author/creator of the post
- `authorId`: Author ID from the platform
- `content`: Text content of the post
- `url`: Direct link to the post
- `mediaUrls`: Array of media attachments with type classification
- `engagement`: Engagement metrics (views, likes, comments, shares, retweets, quotes)
- `publishedAt`: When the post was published on the platform
- `scrapedAt`: When this post was scraped and stored
- `isLatest`: Indicates if this is the most recent post from the account
- `metadata`: Additional platform-specific metadata (JSON field)

### Access Control

- **Read**: Users can read posts if they have access to the related social media account
- **Create/Update/Delete**: Only system/API can modify posts (scraped data)

## Usage

### Storing Posts

Posts are automatically stored when the `/api/social-medias/latest-post` endpoint is called:

```typescript
// Example: Scrape and store latest post from YouTube
GET /api/social-medias/latest-post?channel=channelName&platform=youtube
```

### Querying Posts

```typescript
// Get all posts for a specific social media account
const posts = await payload.find({
  collection: 'social-media-posts',
  where: {
    socialMedia: { equals: socialMediaId },
  },
})

// Get latest post for an account
const latestPost = await payload.find({
  collection: 'social-media-posts',
  where: {
    socialMedia: { equals: socialMediaId },
    isLatest: { equals: true },
  },
  limit: 1,
})

// Get posts by platform
const youtubePosts = await payload.find({
  collection: 'social-media-posts',
  where: {
    platform: { equals: 'youtube' },
  },
})
```

## Database Schema

The collection creates the following database table:

```sql
CREATE TABLE social_media_posts (
  id SERIAL PRIMARY KEY,
  platform VARCHAR NOT NULL,
  socialMedia INTEGER NOT NULL REFERENCES social_medias(id),
  externalId VARCHAR NOT NULL UNIQUE,
  author VARCHAR NOT NULL,
  authorId VARCHAR,
  content TEXT NOT NULL,
  url VARCHAR NOT NULL,
  mediaUrls JSONB,
  engagement JSONB,
  publishedAt TIMESTAMP NOT NULL,
  scrapedAt TIMESTAMP NOT NULL DEFAULT NOW(),
  isLatest BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

## Future Enhancements

- Add relationship field to social media collection to link to posts
- Implement post analytics and reporting
- Add support for more platforms
- Implement post scheduling and publishing
- Add content moderation features

## Notes

- Posts are automatically deduplicated by `externalId` and `socialMedia` combination
- The `isLatest` flag is automatically managed when new posts are stored
- Media URLs are stored as structured data for better querying
- Engagement metrics are normalized across platforms
