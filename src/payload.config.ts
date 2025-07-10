// storage-adapter-import-placeholder
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { AuditLogPlugin } from '@/plugins/audit-log'
import { EmailAdapter } from './shared/utils/emailAdapter'
import { Users } from '@/plugins/users/collections'
import { OrganizationsPlugin } from '@/plugins/organizations'
import { UsersPlugin } from '@/plugins/users'
import { SocialMediasPlugin } from '@/plugins/social-medias'
import { OrganizationAccessPlugin } from '@/plugins/organization-access'
import { PoliciesPlugin } from '@/plugins/policies'
import { FlagsPlugin } from '@/plugins/flags'

import { flagInactiveAccountsTask } from './plugins/social-medias/tasks/flagInactiveAccounts/def'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const auditLogCollections = {
  users: true,
  organization: true,
  'social-medias': true,
  organization_access: true,
  flags: true,
  flagComments: true,
} as const

export type AuditLogCollectionKey = keyof typeof auditLogCollections

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || '',
    },
    push: false,
  }),
  sharp,
  plugins: [
    OrganizationsPlugin({
      disabled: false,
    }),
    UsersPlugin({
      disabled: false,
    }),
    SocialMediasPlugin({
      disabled: false,
    }),
    OrganizationAccessPlugin({
      disabled: false,
    }),
    PoliciesPlugin({
      disabled: false,
    }),
    FlagsPlugin({
      disabled: false,
    }),
    AuditLogPlugin({
      collections: auditLogCollections,
    }),
  ],
  cors: ['http://localhost:3000'],
  cookiePrefix: 'payload',
  email: EmailAdapter(),
  jobs: {
    tasks: [flagInactiveAccountsTask],
    autoRun: [
      {
        //Every sunday at midnight
        cron: '0 0 * * 0',
        queue: 'default',
        limit: 1,
      },
    ],
    shouldAutoRun(payload) {
      return payload.config.jobs?.tasks?.some((task) => task.slug === flagInactiveAccountsTask.slug)
    },
  },
})
