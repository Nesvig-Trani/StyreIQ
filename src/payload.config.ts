// storage-adapter-import-placeholder
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Organizations } from '@/organizations/collections'
import { SocialMedias } from '@/social-medias/collections'
import { AuditLogPlugin } from '@/plugins/audit-log'
import { OrganizationAccess } from '@/organization-access/collections'
import { EmailAdapter } from './shared/utils/emailAdapter'
import { Users } from '@/users/collections'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const auditLogCollections = {
  users: true,
  organization: true,
  'social-medias': true,
  organization_access: true,
} as const

export type AuditLogCollectionKey = keyof typeof auditLogCollections

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Organizations, OrganizationAccess, SocialMedias],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || '',
    },
  }),
  sharp,
  plugins: [
    AuditLogPlugin({
      collections: auditLogCollections,
    }),
  ],
  cors: ['http://localhost:3000'],
  cookiePrefix: 'payload',
  email: EmailAdapter(),
})
