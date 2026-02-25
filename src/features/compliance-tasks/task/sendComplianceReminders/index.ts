import { ComplianceTask, Organization, Tenant, User } from '@/types/payload-types'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { UserRolesEnum } from '@/features/users'
import { Payload } from 'payload'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
import { AuditLogActionEnum } from '@/features/audit-log/plugins/types'
import { calcDaysFromToday } from '@/features/compliance-tasks/utils'

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
    ?.escalationDays as ReminderCadence[]) || [{ day: 3 }, { day: 7 }, { day: 14 }]

  const pendingTasks = await payload.find({
    collection: 'compliance_tasks',
    where: {
      and: [
        { tenant: { equals: tenant.id } },
        { status: { in: ['PENDING', 'OVERDUE', 'ESCALATED'] } },
      ],
    },
    limit: 0,
  })

  for (const task of pendingTasks.docs) {
    try {
      await processTask(payload, task, tenant, { reminderSchedule, escalationDays })
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
  const { daysUntilDue, daysSinceDue } = calcDaysFromToday(task.dueDate)

  const userId = typeof task.assignedUser === 'object' ? task.assignedUser.id : task.assignedUser
  const user = await payload.findByID({ collection: 'users', id: userId })

  if (!user?.email) return { reminderSent: false, escalated: false }

  if (daysUntilDue > 0) {
    const reminderDays = cadences.reminderSchedule.map((d) => d.day)
    const shouldSendReminder = reminderDays.includes(daysUntilDue)

    if (shouldSendReminder) {
      const alreadySent = task.remindersSent?.some((r) => r.daysSinceDue === daysUntilDue)

      if (!alreadySent) {
        const taskUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/compliance`
        const formattedDueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        await payload.update({
          collection: 'compliance_tasks',
          id: task.id,
          data: {
            remindersSent: [
              ...(task.remindersSent || []),
              { sentAt: now.toISOString(), daysSinceDue: daysUntilDue },
            ],
          },
        })

        try {
          await payload.sendEmail({
            to: user.email,
            subject: `Reminder: ${getTaskTypeLabel(task.type)} Due ${formattedDueDate}`,
            html: reminderEmailTemplate({
              userName: user.name || 'User',
              taskName: getTaskTypeLabel(task.type),
              dueDate: formattedDueDate,
              taskUrl,
            }),
          })
        } catch (error) {
          await payload.create({
            collection: 'audit_log',
            data: {
              user: user.id,
              action: AuditLogActionEnum.EmailFailed,
              entity: 'compliance_tasks',
              metadata: {
                taskId: task.id,
                taskType: task.type,
                error: error instanceof Error ? error.message : String(error),
              },
              tenant: tenant.id,
            },
          })
        }

        await payload.create({
          collection: 'audit_log',
          data: {
            user: user.id,
            action: AuditLogActionEnum.ReminderSent,
            entity: 'compliance_tasks',
            metadata: {
              taskId: task.id,
              taskType: task.type,
              daysUntilDue,
              dueDate: task.dueDate,
            },
            organizations: user.organizations || [],
            tenant: tenant.id,
          },
        })

        return { reminderSent: true, escalated: false }
      }
    }
  }

  if (daysSinceDue > 0) {
    const [level1, level2, level3] = cadences.escalationDays.map((d) => d.day)

    const isAlreadyEscalated = (level: number): boolean => {
      return (
        task.escalations?.some((e) => {
          if (!e.escalatedAt) return false
          const { daysSinceDue: escalationDaySinceDue } = calcDaysFromToday(e.escalatedAt)
          return escalationDaySinceDue === level
        }) ?? false
      )
    }

    let escalationLevel: 1 | 2 | 3 | null = null
    if (daysSinceDue === level1) escalationLevel = 1
    else if (daysSinceDue === level2) escalationLevel = 2
    else if (daysSinceDue === level3) escalationLevel = 3

    if (
      escalationLevel &&
      !isAlreadyEscalated(escalationLevel === 1 ? level1 : escalationLevel === 2 ? level2 : level3)
    ) {
      switch (escalationLevel) {
        case 1:
          await sendOverdueNoticeToAssignee(payload, task, user, tenant, daysSinceDue)
          return { reminderSent: false, escalated: true }

        case 2:
          await escalateToUnitAdmin(payload, task, user, tenant, daysSinceDue)
          return { reminderSent: false, escalated: true }

        case 3:
          await escalateToCentralAdmin(payload, task, user, tenant, daysSinceDue)
          return { reminderSent: false, escalated: true }
      }
    }
  }

  return { reminderSent: false, escalated: false }
}

async function sendOverdueNoticeToAssignee(
  payload: Payload,
  task: ComplianceTask,
  user: User,
  tenant: Tenant,
  daysSinceDue: number,
): Promise<void> {
  const taskUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/compliance`
  const formattedDueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  await payload.update({
    collection: 'compliance_tasks',
    id: task.id,
    data: {
      status: 'OVERDUE',
      escalations: [
        ...(task.escalations || []),
        {
          escalatedAt: new Date().toISOString(),
          escalatedTo: user.id,
          reason: `Overdue notice sent to assignee after ${daysSinceDue} days`,
        },
      ],
    },
  })

  try {
    await payload.sendEmail({
      to: user.email,
      subject: `Overdue: ${getTaskTypeLabel(task.type)}`,
      html: overdueNoticeEmailTemplate({
        userName: user.name || 'User',
        taskName: getTaskTypeLabel(task.type),
        dueDate: formattedDueDate,
        taskUrl,
      }),
    })
  } catch (error) {
    await payload.create({
      collection: 'audit_log',
      data: {
        user: user.id,
        action: AuditLogActionEnum.EmailFailed,
        entity: 'compliance_tasks',
        metadata: {
          taskId: task.id,
          taskType: task.type,
          error: error instanceof Error ? error.message : String(error),
        },
        tenant: tenant.id,
      },
    })
  }

  await payload.create({
    collection: 'audit_log',
    data: {
      user: user.id,
      action: AuditLogActionEnum.OverdueNoticeSent,
      entity: 'compliance_tasks',
      metadata: { taskId: task.id, taskType: task.type, daysSinceDue },
      organizations: user.organizations || [],
      tenant: tenant.id,
    },
  })
}

async function escalateToUnitAdmin(
  payload: Payload,
  task: ComplianceTask,
  user: User,
  tenant: Tenant,
  daysSinceDue: number,
): Promise<void> {
  const unitAdmin = await findUnitAdmin(payload, user, tenant)
  if (!unitAdmin) {
    console.warn(`No unit admin found for user ${user.id}, skipping escalation 2`)
    return
  }

  const taskUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/compliance`
  const formattedDueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  await payload.update({
    collection: 'compliance_tasks',
    id: task.id,
    data: {
      escalations: [
        ...(task.escalations || []),
        {
          escalatedAt: new Date().toISOString(),
          escalatedTo: unitAdmin.id,
          reason: `Escalated to Unit Admin after ${daysSinceDue} days overdue`,
        },
      ],
    },
  })

  await createOrUpdateRiskFlag(payload, task, user, tenant, daysSinceDue)

  try {
    await payload.sendEmail({
      to: unitAdmin.email,
      subject: `Escalation: Overdue Compliance Task`,
      html: escalationUnitAdminEmailTemplate({
        adminName: unitAdmin.name || 'Unit Admin',
        assigneeName: user.name || user.email,
        taskName: getTaskTypeLabel(task.type),
        dueDate: formattedDueDate,
        taskUrl,
      }),
    })
  } catch (error) {
    await payload.create({
      collection: 'audit_log',
      data: {
        user: user.id,
        action: AuditLogActionEnum.EmailFailed,
        entity: 'compliance_tasks',
        metadata: {
          taskId: task.id,
          taskType: task.type,
          escalatedTo: unitAdmin.id,
          error: error instanceof Error ? error.message : String(error),
        },
        tenant: tenant.id,
      },
    })
  }

  await payload.create({
    collection: 'audit_log',
    data: {
      user: user.id,
      action: AuditLogActionEnum.EscalatedToUnitAdmin,
      entity: 'compliance_tasks',
      metadata: { taskId: task.id, taskType: task.type, escalatedTo: unitAdmin.id, daysSinceDue },
      organizations: user.organizations || [],
      tenant: tenant.id,
    },
  })
}

async function escalateToCentralAdmin(
  payload: Payload,
  task: ComplianceTask,
  user: User,
  tenant: Tenant,
  daysSinceDue: number,
): Promise<void> {
  const centralAdmin = await findCentralAdmin(payload, tenant)
  if (!centralAdmin) {
    console.warn(`No central admin found for tenant ${tenant.id}, skipping escalation 3`)
    return
  }

  const taskUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/compliance`
  const formattedDueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const userOrgs = user.organizations || []
  const primaryOrgId =
    typeof userOrgs[0] === 'object' ? (userOrgs[0] as Organization).id : userOrgs[0]
  const unit = primaryOrgId
    ? await payload.findByID({ collection: 'organization', id: primaryOrgId })
    : null

  await payload.update({
    collection: 'compliance_tasks',
    id: task.id,
    data: {
      status: 'ESCALATED',
      escalations: [
        ...(task.escalations || []),
        {
          escalatedAt: new Date().toISOString(),
          escalatedTo: centralAdmin.id,
          reason: `Escalated to Central Admin after ${daysSinceDue} days overdue`,
        },
      ],
    },
  })

  await createOrUpdateRiskFlag(payload, task, user, tenant, daysSinceDue)

  try {
    await payload.sendEmail({
      to: centralAdmin.email,
      subject: `Central Escalation: Overdue Compliance Task`,
      html: escalationCentralAdminEmailTemplate({
        adminName: centralAdmin.name || 'Central Admin',
        assigneeName: user.name || user.email,
        unitName: unit?.name || 'Unknown Unit',
        taskName: getTaskTypeLabel(task.type),
        dueDate: formattedDueDate,
        taskUrl,
      }),
    })
  } catch (error) {
    await payload.create({
      collection: 'audit_log',
      data: {
        user: user.id,
        action: AuditLogActionEnum.EmailFailed,
        entity: 'compliance_tasks',
        metadata: {
          taskId: task.id,
          taskType: task.type,
          escalatedTo: centralAdmin.id,
          error: error instanceof Error ? error.message : String(error),
        },
        tenant: tenant.id,
      },
    })
  }

  await payload.create({
    collection: 'audit_log',
    data: {
      user: user.id,
      action: AuditLogActionEnum.EscalatedToCentralAdmin,
      entity: 'compliance_tasks',
      metadata: {
        taskId: task.id,
        taskType: task.type,
        escalatedTo: centralAdmin.id,
        daysSinceDue,
      },
      organizations: user.organizations || [],
      tenant: tenant.id,
    },
  })
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

  const flagType =
    task.type === 'CONFIRM_USER_PASSWORD' ||
    task.type === 'CONFIRM_SHARED_PASSWORD' ||
    task.type === 'CONFIRM_2FA'
      ? 'OVERDUE_SECURITY_TASK'
      : 'OVERDUE_COMPLIANCE_TASK'

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
    await payload.create({
      collection: 'flags',
      data: {
        flagType,
        description: `Compliance task "${task.description || getTaskTypeLabel(task.type)}" is ${daysSinceDue} days overdue and has been escalated. Immediate action required.`,
        status: 'pending',
        assignedTo: user.id,
        organizations: [primaryOrgId],
        tenant: typeof tenant === 'object' ? tenant.id : tenant,
        detectionDate: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        source: 'automated',
        affectedEntity: { relationTo: 'users', value: user.id },
        dueDate: task.dueDate,
      },
    })
  }
}

async function findUnitAdmin(payload: Payload, user: User, tenant: Tenant): Promise<User | null> {
  const effectiveRole = getEffectiveRoleFromUser(user)

  if (effectiveRole === UserRolesEnum.UnitAdmin) {
    return findCentralAdmin(payload, tenant)
  }

  const userOrgs = user.organizations || []
  if (userOrgs.length === 0) return findCentralAdmin(payload, tenant)

  const primaryOrgId =
    typeof userOrgs[0] === 'object' ? (userOrgs[0] as Organization).id : userOrgs[0]

  const organization = await payload.findByID({
    collection: 'organization',
    id: primaryOrgId,
  })

  if (organization?.admin) {
    const adminId =
      typeof organization.admin === 'object' ? organization.admin.id : organization.admin
    const unitAdmin = await payload.findByID({ collection: 'users', id: adminId })
    if (unitAdmin?.email) return unitAdmin
  }

  return findCentralAdmin(payload, tenant)
}

async function findCentralAdmin(payload: Payload, tenant: Tenant): Promise<User | null> {
  const centralAdmins = await payload.find({
    collection: 'users',
    where: {
      and: [{ tenant: { equals: tenant.id } }, { roles: { contains: UserRolesEnum.CentralAdmin } }],
    },
    limit: 1,
  })

  return centralAdmins.docs.length > 0 ? centralAdmins.docs[0] : null
}

function reminderEmailTemplate({
  userName,
  taskName,
  dueDate,
  taskUrl,
}: {
  userName: string
  taskName: string
  dueDate: string
  taskUrl: string
}): string {
  return `
    <html><body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">🔔 Reminder: Action Required</h2>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hello ${userName},</p>
          <p>This is a reminder that the following compliance task is due on <strong>${dueDate}</strong>:</p>
          <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="margin: 0; color: #2563eb;">${taskName}</h3>
          </div>
          <p>Please complete this task before it becomes overdue.</p>
          <a href="${taskUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Access the task here</a>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">This is an automated notification from StyreIQ.</p>
        </div>
      </div>
    </body></html>
  `
}

function overdueNoticeEmailTemplate({
  userName,
  taskName,
  dueDate,
  taskUrl,
}: {
  userName: string
  taskName: string
  dueDate: string
  taskUrl: string
}): string {
  return `
    <html><body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">⚠️ Overdue: Action Required</h2>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hello ${userName},</p>
          <p>The following compliance task is now overdue:</p>
          <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin: 0; color: #dc2626;">${taskName}</h3>
            <p style="margin: 10px 0 0;"><strong>Original Due Date:</strong> ${dueDate}</p>
          </div>
          <p>Please complete this task as soon as possible. If it remains incomplete, visibility will expand to your Unit Admin based on your organization's governance settings.</p>
          <a href="${taskUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Access the task here</a>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">This is an automated notification from StyreIQ.</p>
        </div>
      </div>
    </body></html>
  `
}

function escalationUnitAdminEmailTemplate({
  adminName,
  assigneeName,
  taskName,
  dueDate,
  taskUrl,
}: {
  adminName: string
  assigneeName: string
  taskName: string
  dueDate: string
  taskUrl: string
}): string {
  return `
    <html><body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">🚨 Escalation: Overdue Compliance Task</h2>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hello ${adminName},</p>
          <p>A compliance task assigned within your unit is overdue.</p>
          <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0;"><strong>Assignee:</strong> ${assigneeName}</p>
            <p style="margin: 10px 0 0;"><strong>Task:</strong> ${taskName}</p>
            <p style="margin: 10px 0 0;"><strong>Due Date:</strong> ${dueDate}</p>
          </div>
          <p>This notification is for visibility and follow-up.</p>
          <a href="${taskUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review here</a>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">This is an automated notification from StyreIQ.</p>
        </div>
      </div>
    </body></html>
  `
}

function escalationCentralAdminEmailTemplate({
  adminName,
  assigneeName,
  unitName,
  taskName,
  dueDate,
  taskUrl,
}: {
  adminName: string
  assigneeName: string
  unitName: string
  taskName: string
  dueDate: string
  taskUrl: string
}): string {
  return `
    <html><body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #7c3aed; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">🚨 Central Escalation: Overdue Compliance Task</h2>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hello ${adminName},</p>
          <p>An overdue compliance task has escalated to central visibility.</p>
          <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #7c3aed;">
            <p style="margin: 0;"><strong>Assignee:</strong> ${assigneeName}</p>
            <p style="margin: 10px 0 0;"><strong>Unit:</strong> ${unitName}</p>
            <p style="margin: 10px 0 0;"><strong>Task:</strong> ${taskName}</p>
            <p style="margin: 10px 0 0;"><strong>Due Date:</strong> ${dueDate}</p>
          </div>
          <a href="${taskUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review here</a>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">This is an automated notification from StyreIQ.</p>
        </div>
      </div>
    </body></html>
  `
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
