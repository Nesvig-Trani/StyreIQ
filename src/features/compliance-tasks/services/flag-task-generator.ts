import { Payload } from 'payload'
import { Flag, User } from '@/types/payload-types'
import { ComplianceTaskStatus, ComplianceTaskType } from '@/features/compliance-tasks/schema'
import { ComplianceEmailService } from '@/features/compliance-tasks/services/email-service'

export class FlagTaskGenerator {
  private payload: Payload
  private emailService: ComplianceEmailService

  constructor(payload: Payload) {
    this.payload = payload
    this.emailService = new ComplianceEmailService(payload)
  }

  async createTaskForFlag(flag: Flag, creator: User): Promise<void> {
    if (!flag.assignedTo || !flag.dueDate) {
      console.log(
        `[FlagTaskGenerator] Flag ${flag.id} has no assignedTo or dueDate, skipping task creation`,
      )
      return
    }

    const assignedUserId =
      typeof flag.assignedTo === 'object' ? flag.assignedTo.id : flag.assignedTo
    const tenantId = typeof flag.tenant === 'object' ? flag.tenant?.id : flag.tenant

    if (!tenantId) {
      throw new Error(`Cannot create task for flag ${flag.id}: no tenant`)
    }

    const existingTask = await this.payload.find({
      collection: 'compliance_tasks',
      where: {
        and: [
          { relatedFlag: { equals: flag.id } },
          { type: { equals: ComplianceTaskType.REVIEW_FLAG } },
          { status: { in: ['PENDING', 'OVERDUE'] } },
        ],
      },
      limit: 1,
    })

    if (existingTask.docs.length > 0) {
      console.log(`[FlagTaskGenerator] Task already exists for flag ${flag.id}`)
      return
    }

    const task = await this.payload.create({
      collection: 'compliance_tasks',
      data: {
        type: ComplianceTaskType.REVIEW_FLAG,
        assignedUser: assignedUserId,
        tenant: tenantId,
        status: ComplianceTaskStatus.PENDING,
        dueDate: flag.dueDate,
        description: `Review and resolve risk flag: ${flag.flagType}`,
        relatedFlag: flag.id,
        remindersSent: [],
        escalations: [],
      },
    })

    const assignedUser = await this.payload.findByID({
      collection: 'users',
      id: assignedUserId,
    })

    await this.emailService.sendTaskCreatedEmail(task, assignedUser)

    if (creator.id !== assignedUserId) {
      await this.emailService.sendFlagCreatorNotification(task, creator, assignedUser)
    }

    console.log(`[FlagTaskGenerator] Created task ${task.id} for flag ${flag.id}`)
  }
}
