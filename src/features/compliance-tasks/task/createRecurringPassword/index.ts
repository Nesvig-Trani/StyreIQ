import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { Payload } from 'payload'
import { Tenant, User, ComplianceTask } from '@/types/payload-types'

export async function createRecurringPasswordTasks() {
  const { payload } = await getPayloadContext()

  const tenants = await payload.find({
    collection: 'tenants',
    where: { status: { equals: 'active' } },
    limit: 0,
  })

  await Promise.all(
    tenants.docs.map(async (tenant) => {
      try {
        await processTenantRecurringTasks(payload, tenant)
      } catch (error) {
        console.error(`Failed to process recurring tasks for tenant ${tenant.id}:`, error)
      }
    }),
  )
}

async function processTenantRecurringTasks(payload: Payload, tenant: Tenant): Promise<void> {
  const userPasswordCadence = tenant.governanceSettings?.userPasswordCadenceDays || 180
  const sharedPasswordCadence = tenant.governanceSettings?.sharedPasswordCadenceDays || 180

  const users = await payload.find({
    collection: 'users',
    where: {
      and: [{ tenant: { equals: tenant.id } }, { status: { equals: 'active' } }],
    },
    limit: 0,
  })

  await Promise.all(
    users.docs.map(async (user) => {
      try {
        await processUserRecurringTasks(payload, user, tenant, {
          userPasswordCadence,
          sharedPasswordCadence,
        })
      } catch (error) {
        console.error(`Failed to process user ${user.id}:`, error)
      }
    }),
  )
}

async function processUserRecurringTasks(
  payload: Payload,
  user: User,
  tenant: Tenant,
  cadences: { userPasswordCadence: number; sharedPasswordCadence: number },
): Promise<void> {
  const now = new Date()

  await Promise.all([
    checkAndCreateTask(
      payload,
      user,
      tenant,
      'CONFIRM_USER_PASSWORD' as ComplianceTask['type'],
      cadences.userPasswordCadence,
      now,
      'Confirm that you have updated your user password according to organizational requirements.',
    ),
    checkAndCreateTask(
      payload,
      user,
      tenant,
      'CONFIRM_2FA' as ComplianceTask['type'],
      cadences.userPasswordCadence,
      now,
      'Confirm that two-factor authentication (2FA) is enabled on all assigned social media accounts.',
    ),
    checkAndCreateSharedPasswordTask(payload, user, tenant, cadences.sharedPasswordCadence, now),
  ])
}

async function getTaskStatus(
  payload: Payload,
  userId: number,
  taskType: ComplianceTask['type'],
): Promise<{ hasPending: boolean; lastCompleted: ComplianceTask | null }> {
  const [pendingTasks, completedTasks] = await Promise.all([
    payload.find({
      collection: 'compliance_tasks',
      where: {
        and: [
          { assignedUser: { equals: userId } },
          { type: { equals: taskType } },
          { status: { in: ['PENDING', 'OVERDUE'] } },
        ],
      },
      limit: 1,
    }),
    payload.find({
      collection: 'compliance_tasks',
      where: {
        and: [
          { assignedUser: { equals: userId } },
          { type: { equals: taskType } },
          { status: { equals: 'COMPLETED' } },
        ],
      },
      sort: '-completedAt',
      limit: 1,
    }),
  ])

  return {
    hasPending: pendingTasks.totalDocs > 0,
    lastCompleted: completedTasks.totalDocs > 0 ? completedTasks.docs[0] : null,
  }
}

function shouldCreateTask(
  lastCompleted: ComplianceTask | null,
  cadenceDays: number,
  now: Date,
): boolean {
  if (!lastCompleted) return false

  const completedDate = new Date(lastCompleted.completedAt!)
  const daysSinceCompleted = Math.floor(
    (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24),
  )

  return daysSinceCompleted >= cadenceDays
}

async function createNewTask(
  payload: Payload,
  user: User,
  tenant: Tenant,
  taskType: ComplianceTask['type'],
  description: string,
  now: Date,
): Promise<void> {
  const dueDate = new Date(now)
  dueDate.setDate(dueDate.getDate() + 30)

  await payload.create({
    collection: 'compliance_tasks',
    data: {
      type: taskType,
      assignedUser: user.id,
      tenant: tenant.id,
      status: 'PENDING',
      dueDate: dueDate.toISOString(),
      description,
      remindersSent: [],
      escalations: [],
    },
  })
}

async function checkAndCreateTask(
  payload: Payload,
  user: User,
  tenant: Tenant,
  taskType: ComplianceTask['type'],
  cadenceDays: number,
  now: Date,
  description: string,
): Promise<void> {
  const { hasPending, lastCompleted } = await getTaskStatus(payload, user.id, taskType)

  if (hasPending) return

  if (shouldCreateTask(lastCompleted, cadenceDays, now)) {
    await createNewTask(payload, user, tenant, taskType, description, now)
  }
}

async function checkAndCreateSharedPasswordTask(
  payload: Payload,
  user: User,
  tenant: Tenant,
  cadenceDays: number,
  now: Date,
): Promise<void> {
  const sharedAccounts = await payload.find({
    collection: 'social-medias',
    where: {
      and: [
        {
          or: [
            { socialMediaManagers: { contains: user.id } },
            { primaryAdmin: { equals: user.id } },
            { backupAdmin: { equals: user.id } },
          ],
        },
        { isSharedCredential: { equals: true } },
      ],
    },
    limit: 1,
  })

  if (sharedAccounts.totalDocs === 0) return

  await checkAndCreateTask(
    payload,
    user,
    tenant,
    'CONFIRM_SHARED_PASSWORD' as ComplianceTask['type'],
    cadenceDays,
    now,
    'Confirm that the shared account password has been changed and redistributed securely.',
  )
}
