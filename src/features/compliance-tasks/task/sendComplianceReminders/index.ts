import { ComplianceTask, Organization, Tenant, User } from '@/types/payload-types'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { UserRolesEnum } from '@/features/users'
import { complianceReminderEmailBody } from '../../constants/complianceReminderEmailBody'
import { Payload } from 'payload'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

interface ReminderCadence {
  day: number
}

export async function sendComplianceReminders() {
  const { payload } = await getPayloadContext()

  const tenants = await payload.find({
    collection: 'tenants',
    where: { status: { equals: 'active' } },
    limit: 0,
  })

  for (const tenant of tenants.docs) {
    try {
      await processTenantReminders(payload, tenant)
    } catch (error) {
      console.error(`Failed to process reminders for tenant ${tenant.id}:`, error)
    }
  }
}

async function processTenantReminders(payload: Payload, tenant: Tenant): Promise<void> {
  const reminderSchedule: ReminderCadence[] = (tenant.governanceSettings
    ?.reminderSchedule as ReminderCadence[]) || [{ day: 3 }, { day: 7 }, { day: 14 }]

  const escalationDays: ReminderCadence[] = (tenant.governanceSettings
    ?.escalationDays as ReminderCadence[]) || [{ day: 15 }, { day: 30 }, { day: 45 }]

  const pendingTasks = await payload.find({
    collection: 'compliance_tasks',
    where: {
      and: [{ tenant: { equals: tenant.id } }, { status: { in: ['PENDING', 'OVERDUE'] } }],
    },
    limit: 0,
  })

  for (const task of pendingTasks.docs) {
    try {
      await processTask(payload, task, tenant, {
        reminderSchedule,
        escalationDays,
      })
    } catch (error) {
      console.error(`Failed to process task ${task.id} for tenant ${tenant.id}:`, error)
    }
  }
}

async function processTask(
  payload: Payload,
  task: ComplianceTask,
  tenant: Tenant,
  cadences: {
    reminderSchedule: ReminderCadence[]
    escalationDays: ReminderCadence[]
  },
): Promise<{ reminderSent: boolean; escalated: boolean }> {
  const now = new Date()
  const dueDate = new Date(task.dueDate)
  const daysSinceDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

  const reminderDays = cadences.reminderSchedule.map((d) => d.day)

  const shouldSendReminder = reminderDays.includes(daysSinceDue)

  if (!shouldSendReminder) {
    return { reminderSent: false, escalated: false }
  }

  const alreadySent = task.remindersSent?.some((r) => r.daysSinceDue === daysSinceDue)

  if (alreadySent) {
    return { reminderSent: false, escalated: false }
  }

  const userId = typeof task.assignedUser === 'object' ? task.assignedUser.id : task.assignedUser

  const user = await payload.findByID({
    collection: 'users',
    id: userId,
  })

  if (!user?.email) {
    return { reminderSent: false, escalated: false }
  }

  await sendReminderEmail(payload, task, user, daysSinceDue)

  await payload.update({
    collection: 'compliance_tasks',
    id: task.id,
    data: {
      remindersSent: [
        ...(task.remindersSent || []),
        {
          sentAt: now.toISOString(),
          daysSinceDue: daysSinceDue,
        },
      ],
    },
  })

  await payload.create({
    collection: 'audit_log',
    data: {
      user: user.id,
      action: 'reminder_sent',
      entity: 'compliance_tasks',
      metadata: {
        taskId: task.id,
        taskType: task.type,
        daysSinceDue: daysSinceDue,
        reminderNumber: (task.remindersSent?.length || 0) + 1,
        dueDate: task.dueDate,
      },
      organizations: user.organizations || [],
      tenant: tenant.id,
    },
  })

  const escalationSchedule = cadences.escalationDays.map((d) => d.day)
  const lastEscalationDay = escalationSchedule[escalationSchedule.length - 1]
  const shouldEscalate = daysSinceDue === lastEscalationDay

  if (shouldEscalate) {
    await escalateTask(payload, task, user, tenant, daysSinceDue)
    return { reminderSent: true, escalated: true }
  }

  return { reminderSent: true, escalated: false }
}

async function sendReminderEmail(
  payload: Payload,
  task: ComplianceTask,
  user: User,
  daysSinceDue: number,
): Promise<void> {
  await payload.sendEmail({
    to: user.email,
    subject: `Reminder: ${getTaskTypeLabel(task.type)} ${daysSinceDue > 0 ? '(OVERDUE)' : ''}`,
    html: complianceReminderEmailBody({
      userName: user.name || 'User',
      taskType: getTaskTypeLabel(task.type),
      taskDescription: task.description || 'No description provided',
      dueDate: task.dueDate,
      daysSinceDue: daysSinceDue,
      isEscalation: false,
    }),
  })
}

async function escalateTask(
  payload: Payload,
  task: ComplianceTask,
  user: User,
  tenant: Tenant,
  daysSinceDue: number,
): Promise<void> {
  const escalationTarget = await findEscalationTarget(payload, user, tenant)

  if (!escalationTarget) {
    console.warn(`No escalation target found for user ${user.id} in tenant ${tenant.id}`)
    return
  }

  await payload.update({
    collection: 'compliance_tasks',
    id: task.id,
    data: {
      status: 'ESCALATED',
      escalations: [
        ...(task.escalations || []),
        {
          escalatedAt: new Date().toISOString(),
          escalatedTo: escalationTarget.id,
          reason: `Task overdue - escalated after final reminder`,
        },
      ],
    },
  })

  await createOrUpdateRiskFlag(payload, task, user, tenant, daysSinceDue)

  await sendEscalationEmail(payload, task, user, escalationTarget, daysSinceDue)

  await createEscalationAuditLog(payload, task, user, escalationTarget, tenant, daysSinceDue)
}

async function createOrUpdateRiskFlag(
  payload: Payload,
  task: ComplianceTask,
  user: User,
  tenant: Tenant,
  daysSinceDue: number,
): Promise<void> {
  const userOrgs = user.organizations || []

  if (userOrgs.length === 0) {
    console.warn(`User ${user.id} has no organizations, cannot create risk flag`)
    return
  }

  const primaryOrg = userOrgs[0]
  const primaryOrgId = typeof primaryOrg === 'object' ? (primaryOrg as Organization).id : primaryOrg

  let flagType = 'OVERDUE_COMPLIANCE_TASK'

  if (
    task.type === 'CONFIRM_USER_PASSWORD' ||
    task.type === 'CONFIRM_SHARED_PASSWORD' ||
    task.type === 'CONFIRM_2FA'
  ) {
    flagType = 'OVERDUE_SECURITY_TASK'
  }

  const existingFlags = await payload.find({
    collection: 'flags',
    where: {
      and: [{ relatedComplianceTask: { equals: task.id } }, { status: { not_equals: 'resolved' } }],
    },
    limit: 1,
  })

  if (existingFlags.totalDocs > 0) {
    const flag = existingFlags.docs[0]
    await payload.update({
      collection: 'flags',
      id: flag.id,
      data: {
        description: `${flag.description || ''}\n\n[Update] Task escalated after ${daysSinceDue} days overdue.`,
        lastActivity: new Date().toISOString(),
      },
    })
  } else {
    try {
      await payload.create({
        collection: 'flags',
        data: {
          flagType: flagType,
          description: `Compliance task "${task.description || getTaskTypeLabel(task.type)}" is ${daysSinceDue} days overdue and has been escalated. Immediate action required.`,
          status: 'pending',
          assignedTo: user.id,
          organizations: [primaryOrgId],
          tenant: typeof tenant === 'object' ? tenant.id : tenant,
          detectionDate: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          source: 'automated',
          affectedEntity: {
            relationTo: 'users',
            value: user.id,
          },
          dueDate: task.dueDate,
        },
      })
    } catch (error) {
      console.error(`Failed to create risk flag for task ${task.id}:`, error)
      throw new Error('Risk flag creation failed')
    }
  }
}

async function findEscalationTarget(
  payload: Payload,
  user: User,
  tenant: Tenant,
): Promise<User | null> {
  const effectiveRole = getEffectiveRoleFromUser(user)
  switch (effectiveRole) {
    case UserRolesEnum.SocialMediaManager: {
      const userOrgs = user.organizations || []

      if (userOrgs.length === 0) {
        return findCentralAdmin(payload, tenant)
      }

      const primaryOrg = userOrgs[0]
      const primaryOrgId =
        typeof primaryOrg === 'object' ? (primaryOrg as Organization).id : primaryOrg

      const organization = await payload.findByID({
        collection: 'organization',
        id: primaryOrgId,
      })

      if (organization?.admin) {
        const adminId =
          typeof organization.admin === 'object' ? organization.admin.id : organization.admin

        const unitAdmin = await payload.findByID({
          collection: 'users',
          id: adminId,
        })

        if (unitAdmin?.email) {
          return unitAdmin
        }
      }

      return findCentralAdmin(payload, tenant)
    }

    case UserRolesEnum.UnitAdmin:
      return findCentralAdmin(payload, tenant)

    case UserRolesEnum.CentralAdmin:
      return null

    default:
      return null
  }
}

async function findCentralAdmin(payload: Payload, tenant: Tenant): Promise<User | null> {
  const centralAdmins = await payload.find({
    collection: 'users',
    where: {
      and: [{ tenant: { equals: tenant.id } }, { role: { equals: UserRolesEnum.CentralAdmin } }],
    },
    limit: 1,
  })

  if (centralAdmins.docs.length > 0) {
    return centralAdmins.docs[0]
  }

  return null
}

async function sendEscalationEmail(
  payload: Payload,
  task: ComplianceTask,
  fromUser: User,
  toUser: User,
  daysSinceDue: number,
): Promise<void> {
  await payload.sendEmail({
    to: toUser.email,
    subject: `ESCALATION: Overdue compliance task from ${fromUser.name || fromUser.email}`,
    html: complianceReminderEmailBody({
      userName: toUser.name || 'Administrator',
      taskType: getTaskTypeLabel(task.type),
      taskDescription: task.description || 'No description provided',
      dueDate: task.dueDate,
      daysSinceDue: daysSinceDue,
      isEscalation: true,
      escalatedFromUser: fromUser.name || fromUser.email,
    }),
  })
}

async function createEscalationAuditLog(
  payload: Payload,
  task: ComplianceTask,
  fromUser: User,
  toUser: User,
  tenant: Tenant,
  daysSinceDue: number,
): Promise<void> {
  await payload.create({
    collection: 'audit_log',
    data: {
      user: toUser.id,
      action: 'task_escalation',
      entity: 'compliance_tasks',
      metadata: {
        taskId: task.id,
        taskType: task.type,
        escalatedFrom: fromUser.id,
        escalatedTo: toUser.id,
        daysSinceDue: daysSinceDue,
        reason: 'Task overdue - escalated after final reminder',
      },
      organizations: fromUser.organizations || [],
      tenant: tenant.id,
    },
  })
}

function getTaskTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PASSWORD_SETUP: 'Password Setup',
    CONFIRM_USER_PASSWORD: 'Confirm User Password',
    CONFIRM_SHARED_PASSWORD: 'Confirm Shared Password',
    CONFIRM_2FA: 'Confirm Two-Factor Authentication',
    POLICY_ACKNOWLEDGMENT: 'Policy Acknowledgment',
    TRAINING_COMPLETION: 'Training Completion',
    USER_ROLL_CALL: 'User Roll Call',
    REVIEW_FLAG: 'Review Risk Flag',
  }
  return labels[type] || type
}
