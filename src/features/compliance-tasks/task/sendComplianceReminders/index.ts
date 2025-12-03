import { ComplianceTask, Organization, Tenant, User } from '@/types/payload-types'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { UserRolesEnum } from '@/features/users'
import { complianceReminderEmailBody } from '../../constants/complianceReminderEmailBody'
import { Payload } from 'payload'

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
  const policyReminderDays: ReminderCadence[] = (tenant.governanceSettings
    ?.policyReminderDays as ReminderCadence[]) || [{ day: 3 }, { day: 7 }, { day: 14 }]

  const trainingEscalationDays: ReminderCadence[] = (tenant.governanceSettings
    ?.trainingEscalationDays as ReminderCadence[]) || [{ day: 15 }, { day: 30 }, { day: 45 }]

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
        policyReminderDays,
        trainingEscalationDays,
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
    policyReminderDays: ReminderCadence[]
    trainingEscalationDays: ReminderCadence[]
  },
): Promise<{ reminderSent: boolean; escalated: boolean }> {
  const now = new Date()
  const dueDate = new Date(task.dueDate)
  const daysSinceDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

  const reminderCadence = getReminderCadence(task.type, cadences)

  const shouldSendReminder = reminderCadence.includes(daysSinceDue)

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

  const lastReminderDay = reminderCadence[reminderCadence.length - 1]
  const shouldEscalate = daysSinceDue === lastReminderDay

  if (shouldEscalate) {
    await escalateTask(payload, task, user, tenant, daysSinceDue)
    return { reminderSent: true, escalated: true }
  }

  return { reminderSent: true, escalated: false }
}

function getReminderCadence(
  taskType: string,
  cadences: {
    policyReminderDays: ReminderCadence[]
    trainingEscalationDays: ReminderCadence[]
  },
): number[] {
  switch (taskType) {
    case 'POLICY_ACKNOWLEDGMENT':
      return cadences.policyReminderDays.map((d) => d.day)
    case 'TRAINING_COMPLETION':
      return cadences.trainingEscalationDays.map((d) => d.day)
    case 'PASSWORD_SETUP':
    case 'USER_ROLL_CALL':
    default:
      return [3, 7, 14]
  }
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

  await sendEscalationEmail(payload, task, user, escalationTarget, daysSinceDue)

  await createEscalationAuditLog(payload, task, user, escalationTarget, tenant, daysSinceDue)
}

async function findEscalationTarget(
  payload: Payload,
  user: User,
  tenant: Tenant,
): Promise<User | null> {
  switch (user.role) {
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
      },
      organizations: fromUser.organizations || [],
      tenant: tenant.id,
    },
  })
}

function getTaskTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PASSWORD_SETUP: 'Password Setup',
    POLICY_ACKNOWLEDGMENT: 'Policy Acknowledgment',
    TRAINING_COMPLETION: 'Training Completion',
    USER_ROLL_CALL: 'User Roll Call',
  }
  return labels[type] || type
}
