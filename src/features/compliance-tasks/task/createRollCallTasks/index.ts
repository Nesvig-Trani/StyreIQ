import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { Tenant, User } from '@/types/payload-types'
import { ComplianceTaskGenerator } from '../../services/compliance-task-generator'
import { Payload } from 'payload'

export async function createRollCallTasks() {
  const { payload } = await getPayloadContext()

  const tenants = await payload.find({
    collection: 'tenants',
    where: { status: { equals: 'active' } },
    limit: 0,
  })

  for (const tenant of tenants.docs) {
    try {
      await processTenantRollCall(payload, tenant)
    } catch (error) {
      console.error(`Failed to process roll call for tenant ${tenant.id}:`, error)
    }
  }
}

async function processTenantRollCall(payload: Payload, tenant: Tenant): Promise<void> {
  const frequency = tenant.governanceSettings?.rollCallFrequency || 'quarterly'
  const daysBetweenRollCalls = getFrequencyInDays(frequency)

  const users = await payload.find({
    collection: 'users',
    where: {
      and: [{ tenant: { equals: tenant.id } }, { status: { equals: 'active' } }],
    },
    limit: 0,
  })

  const generator = new ComplianceTaskGenerator(payload)

  const [pendingRollCalls, completedRollCalls] = await Promise.all([
    payload.find({
      collection: 'compliance_tasks',
      where: {
        and: [
          { tenant: { equals: tenant.id } },
          { type: { equals: 'USER_ROLL_CALL' } },
          { status: { in: ['PENDING', 'OVERDUE'] } },
        ],
      },
      limit: 0,
    }),
    payload.find({
      collection: 'compliance_tasks',
      where: {
        and: [
          { tenant: { equals: tenant.id } },
          { type: { equals: 'USER_ROLL_CALL' } },
          { status: { equals: 'COMPLETED' } },
        ],
      },
      sort: '-completedAt',
      limit: 0,
    }),
  ])

  const usersPendingRollCall = new Set(
    pendingRollCalls.docs.map((task) =>
      typeof task.assignedUser === 'object' ? task.assignedUser.id : task.assignedUser,
    ),
  )

  const usersLastCompletedRollCall = new Map<number, Date>()
  completedRollCalls.docs.forEach((task) => {
    const userId = typeof task.assignedUser === 'object' ? task.assignedUser.id : task.assignedUser
    const completedAt = task.completedAt ? new Date(task.completedAt) : null

    if (completedAt && !usersLastCompletedRollCall.has(userId)) {
      usersLastCompletedRollCall.set(userId, completedAt)
    }
  })

  const usersNeedingRollCall: Array<{ user: User; daysSince: number | null }> = []
  const now = new Date()

  for (const user of users.docs) {
    try {
      if (usersPendingRollCall.has(user.id)) {
        continue
      }

      const lastCompletedDate = usersLastCompletedRollCall.get(user.id)
      if (!lastCompletedDate) {
        continue
      }

      const daysSinceCompleted = Math.floor(
        (now.getTime() - lastCompletedDate.getTime()) / (1000 * 60 * 60 * 24),
      )

      if (daysSinceCompleted >= daysBetweenRollCalls) {
        usersNeedingRollCall.push({ user, daysSince: daysSinceCompleted })
      }
    } catch (error) {
      console.error(`Error checking roll call for user ${user.id}:`, error)
    }
  }

  if (usersNeedingRollCall.length === 0) {
    return
  }

  const results = await Promise.allSettled(
    usersNeedingRollCall.map(async ({ user, daysSince }) => {
      try {
        await generator.generateRollCallTask(user.id)

        await payload.create({
          collection: 'audit_log',
          data: {
            user: user.id,
            action: 'roll_call_auto_generated',
            entity: 'compliance_tasks',
            metadata: {
              userId: user.id,
              tenantId: tenant.id,
              frequency,
              daysSinceLastRollCall: daysSince,
              type: 'cadence_based',
            },
            tenant: tenant.id,
          },
        })

        return { success: true, userId: user.id }
      } catch (error) {
        await payload.create({
          collection: 'audit_log',
          data: {
            user: user.id,
            action: 'roll_call_auto_generation_failed',
            entity: 'compliance_tasks',
            metadata: {
              userId: user.id,
              tenantId: tenant.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            tenant: tenant.id,
          },
        })

        return { success: false, userId: user.id, error }
      }
    }),
  )

  const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length
  const failed = results.filter((r) => r.status === 'rejected' || !r.value.success).length

  console.log(
    `Roll call generation for tenant ${tenant.id}: ${successful} successful, ${failed} failed`,
  )
}

function getFrequencyInDays(frequency: string): number {
  const daysMap: Record<string, number> = {
    monthly: 30,
    quarterly: 90,
    semiannual: 180,
    annual: 365,
  }

  return daysMap[frequency] || 90
}
