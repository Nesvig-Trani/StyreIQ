import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  async rewrites() {
    return [
      {
        source: '/trainings/:path*',
        destination: '/api/serve-training/:path*',
      },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
