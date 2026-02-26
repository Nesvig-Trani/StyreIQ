// storage-adapter-import-placeholder
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { AuditLogPlugin } from '@/features/audit-log/plugins'
import { EmailAdapter } from '../../shared/utils/emailAdapter'
import { Users } from '@/features/users/plugins/collections'
import { OrganizationsPlugin } from '@/features/units/plugins'
import { UsersPlugin } from '@/features/users/plugins'
import { SocialMediasPlugin } from '@/features/social-medias/plugins'
import { PoliciesPlugin } from '@/features/policies/plugins'
import { FlagsPlugin } from '@/features/flags/plugins'
import { WelcomeEmailsPlugin } from '@/features/welcome-emails/plugins'
import { flagInactiveAccountsTask } from '../../features/social-medias/plugins/tasks/flagInactiveAccounts/def'
import { detectRisksTask } from '../../features/flags/plugins/tasks/detectRisks/def'
import { TenantPlugin } from '@/features/tenants/plugins'
import { tenantContextMiddleware } from '@/middleware/tenant-context'
import { ComplianceTasksPlugin } from '@/features/compliance-tasks/plugins'
import { sendComplianceRemindersTask } from '@/features/compliance-tasks/task/sendComplianceReminders/def'
import { RoleRequestsPlugin } from '@/features/role-request/plugins'
import { createRecurringPasswordTasksTask } from '@/features/compliance-tasks/task/createRecurringPassword/def'
import { createRollCallTasksTask } from '@/features/compliance-tasks/task/createRollCallTasks/def'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const ALL_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const

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
    outputFile: path.resolve(dirname, '../../types/payload-types.ts'),
  },
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || '',
    },
    push: false,
    generateSchemaOutputFile: path.resolve(dirname, '../../types/payload-db-schema.ts'),
  }),
  sharp,
  endpoints: [
    ...ALL_METHODS.map((m) => ({
      path: '/api/*',
      method: m,
      handler: tenantContextMiddleware,
    })),
  ],
  plugins: [
    OrganizationsPlugin({
      disabled: false,
    }),
    WelcomeEmailsPlugin({
      disabled: false,
    }),
    UsersPlugin({
      disabled: false,
    }),
    SocialMediasPlugin({
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
    TenantPlugin({
      disabled: false,
    }),
    ComplianceTasksPlugin({
      disabled: false,
      autoGenerateOnUserCreation: true,
    }),
    RoleRequestsPlugin({
      disabled: false,
    }),
  ],
  cors: ['http://localhost:3000'],
  cookiePrefix: 'payload',
  email: EmailAdapter(),
  jobs: {
    tasks: [
      flagInactiveAccountsTask,
      detectRisksTask,
      sendComplianceRemindersTask,
      createRecurringPasswordTasksTask,
      createRollCallTasksTask,
    ],
    autoRun: [
      {
        cron: '0 7 * * *',
        limit: 10,
      },
    ],
    shouldAutoRun(payload) {
      return payload.config.jobs?.tasks?.some(
        (task) =>
          task.slug === flagInactiveAccountsTask.slug ||
          task.slug === detectRisksTask.slug ||
          task.slug === sendComplianceRemindersTask.slug ||
          task.slug === createRecurringPasswordTasksTask.slug ||
          task.slug === createRollCallTasksTask.slug,
      )
    },
  },
})
