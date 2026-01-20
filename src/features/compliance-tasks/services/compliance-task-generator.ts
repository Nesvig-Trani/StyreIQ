import { Payload } from 'payload'
import { User } from '@/types/payload-types'
import { UserRolesEnum } from '@/features/users'
import { ComplianceTaskStatus, ComplianceTaskType } from '../schema'
import { ComplianceEmailService } from './email-service'

export class ComplianceTaskGenerator {
  private payload: Payload
  private emailService: ComplianceEmailService

  constructor(payload: Payload) {
    this.payload = payload
    this.emailService = new ComplianceEmailService(payload)
  }

  async generateTasksForNewUserExceptRollCall(user: User): Promise<void> {
    if (!user.tenant) {
      throw new Error(`Cannot generate compliance tasks: User ${user.id} has no tenant assigned`)
    }

    try {
      await this.createUserPasswordTask(user)
      await this.createTwoFactorTask(user)
      await this.createSharedPasswordTaskIfNeeded(user)

      await this.createPolicyAcknowledgmentTasks(user)

      await this.createTrainingTasks(user)
    } catch (error) {
      throw error
    }
  }

  async generateTasksForNewUser(user: User): Promise<void> {
    return this.generateTasksForNewUserExceptRollCall(user)
  }

  async generateRollCallTask(userId: number): Promise<void> {
    const existingTask = await this.payload.find({
      collection: 'compliance_tasks',
      where: {
        and: [
          { assignedUser: { equals: userId } },
          { type: { equals: ComplianceTaskType.USER_ROLL_CALL } },
          { status: { in: ['PENDING', 'OVERDUE'] } },
        ],
      },
      limit: 1,
    })

    if (existingTask.docs.length > 0) {
      throw new Error(`User ${userId} already has a pending Roll Call task`)
    }

    const user = await this.payload.findByID({
      collection: 'users',
      id: userId,
    })

    if (!user) {
      throw new Error(`User ${userId} not found`)
    }

    await this.createRollCallTask(user)
  }

  private async createUserPasswordTask(user: User): Promise<void> {
    if (!user.tenant) {
      throw new Error('User tenant is required')
    }

    const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant

    const existingTask = await this.payload.find({
      collection: 'compliance_tasks',
      where: {
        and: [
          { assignedUser: { equals: user.id } },
          { type: { equals: ComplianceTaskType.CONFIRM_USER_PASSWORD } },
          { status: { in: ['PENDING', 'OVERDUE'] } },
        ],
      },
      limit: 1,
    })

    if (existingTask.docs.length > 0) {
      return
    }

    const dueDate = this.addDays(new Date(), 30)

    const task = await this.payload.create({
      collection: 'compliance_tasks',
      data: {
        type: ComplianceTaskType.CONFIRM_USER_PASSWORD,
        assignedUser: user.id,
        tenant: tenantId,
        status: ComplianceTaskStatus.PENDING,
        dueDate: dueDate.toISOString(),
        description:
          'Confirm you have updated your personal login password according to organizational requirements.',
        remindersSent: [],
        escalations: [],
      },
    })

    try {
      await this.emailService.sendTaskCreatedEmail(task, user)
    } catch (error) {
      console.error('createUserPasswordTask failed to send email but task was created', error)
    }
  }

  private async createTwoFactorTask(user: User): Promise<void> {
    if (!user.tenant) {
      throw new Error('User tenant is required')
    }

    const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant

    const existingTask = await this.payload.find({
      collection: 'compliance_tasks',
      where: {
        and: [
          { assignedUser: { equals: user.id } },
          { type: { equals: ComplianceTaskType.CONFIRM_2FA } },
          { status: { in: ['PENDING', 'OVERDUE'] } },
        ],
      },
      limit: 1,
    })

    if (existingTask.docs.length > 0) {
      return
    }

    const dueDate = this.addDays(new Date(), 30)

    const task = await this.payload.create({
      collection: 'compliance_tasks',
      data: {
        type: ComplianceTaskType.CONFIRM_2FA,
        assignedUser: user.id,
        tenant: tenantId,
        status: ComplianceTaskStatus.PENDING,
        dueDate: dueDate.toISOString(),
        description:
          'Confirm that two-factor authentication (2FA) is enabled on all applicable social media accounts.',
        remindersSent: [],
        escalations: [],
      },
    })

    try {
      await this.emailService.sendTaskCreatedEmail(task, user)
    } catch (error) {
      console.error('createTwoFactorTask failed to send email but task was created', error)
    }
  }

  private async createSharedPasswordTaskIfNeeded(user: User): Promise<void> {
    if (!user.tenant) {
      throw new Error('User tenant is required')
    }

    const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant

    const sharedAccounts = await this.payload.find({
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
    if (sharedAccounts.docs.length === 0) {
      return
    }

    const existingTask = await this.payload.find({
      collection: 'compliance_tasks',
      where: {
        and: [
          { assignedUser: { equals: user.id } },
          { type: { equals: ComplianceTaskType.CONFIRM_SHARED_PASSWORD } },
          { status: { in: ['PENDING', 'OVERDUE'] } },
        ],
      },
      limit: 1,
    })

    if (existingTask.docs.length > 0) {
      return
    }

    const dueDate = this.addDays(new Date(), 30)

    const task = await this.payload.create({
      collection: 'compliance_tasks',
      data: {
        type: ComplianceTaskType.CONFIRM_SHARED_PASSWORD,
        assignedUser: user.id,
        tenant: tenantId,
        status: ComplianceTaskStatus.PENDING,
        dueDate: dueDate.toISOString(),
        description:
          'Confirm shared login credentials were updated and shared using your organizations approved method.',
        remindersSent: [],
        escalations: [],
      },
    })

    try {
      await this.emailService.sendTaskCreatedEmail(task, user)
    } catch (error) {
      console.error(
        'createSharedPasswordTaskIfNeeded failed to send email but task was created',
        error,
      )
    }
  }

  private async createPolicyAcknowledgmentTasks(user: User): Promise<void> {
    if (!user.tenant) {
      throw new Error('User tenant is required')
    }

    const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant

    const allPolicies = await this.payload.find({
      collection: 'policies',
      where: {
        tenant: { equals: tenantId },
      },
      sort: '-version',
      limit: 1,
    })

    if (allPolicies.docs.length === 0) {
      return
    }

    const latestPolicy = allPolicies.docs[0]

    const existingTasks = await this.payload.find({
      collection: 'compliance_tasks',
      where: {
        and: [
          { assignedUser: { equals: user.id } },
          { type: { equals: ComplianceTaskType.POLICY_ACKNOWLEDGMENT } },
          { status: { in: ['PENDING', 'OVERDUE'] } },
          { relatedPolicy: { equals: latestPolicy.id } },
        ],
      },
      limit: 1,
    })

    if (existingTasks.totalDocs > 0) {
      return
    }

    const dueDate = this.addDays(new Date(), 14)

    const taskData = {
      type: ComplianceTaskType.POLICY_ACKNOWLEDGMENT,
      assignedUser: user.id,
      tenant: tenantId,
      status: ComplianceTaskStatus.PENDING,
      dueDate: dueDate.toISOString(),
      description: `Review and acknowledge policy version ${latestPolicy.version}`,
      relatedPolicy: latestPolicy.id,
      remindersSent: [],
      escalations: [],
    }

    const createdTask = await this.payload.create({
      collection: 'compliance_tasks',
      data: taskData,
    })

    try {
      await this.emailService.sendTaskCreatedEmail(createdTask, user)
    } catch (error) {
      console.error(
        'createPolicyAcknowledgmentTasks failed to send email for task',
        createdTask.id,
        error,
      )
    }
  }

  private async createTrainingTasks(user: User): Promise<void> {
    if (!user.tenant) {
      throw new Error('User tenant is required')
    }

    const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant

    const tenant = await this.payload.findByID({
      collection: 'tenants',
      id: tenantId,
    })

    const trainingWindow =
      tenant.governanceSettings &&
      Array.isArray(tenant.governanceSettings.trainingEscalationDays) &&
      tenant.governanceSettings.trainingEscalationDays[1]
        ? (tenant.governanceSettings.trainingEscalationDays[1] as { day: number }).day
        : 30

    const dueDate = this.addDays(new Date(), trainingWindow)

    const requiredTrainings = await this.getRequiredTrainingsForUser(user)

    if (requiredTrainings.length === 0) {
      return
    }

    const existingTasks = await this.payload.find({
      collection: 'compliance_tasks',
      where: {
        and: [
          { assignedUser: { equals: user.id } },
          { type: { equals: ComplianceTaskType.TRAINING_COMPLETION } },
          { status: { in: ['PENDING', 'OVERDUE'] } },
        ],
      },
      limit: 0,
    })

    const existingTrainingIds = new Set(
      existingTasks.docs
        .map((task) => {
          if (!task.relatedTraining) return null
          return typeof task.relatedTraining === 'object'
            ? (task.relatedTraining as { id: string }).id
            : task.relatedTraining
        })
        .filter((id): id is string => id !== null),
    )

    const trainingsNeedingTasks = requiredTrainings.filter(
      (training) => !existingTrainingIds.has(training.id),
    )

    if (trainingsNeedingTasks.length === 0) {
      return
    }

    const tasksData = trainingsNeedingTasks.map((training) => ({
      type: ComplianceTaskType.TRAINING_COMPLETION,
      assignedUser: user.id,
      tenant: tenantId,
      status: ComplianceTaskStatus.PENDING,
      dueDate: dueDate.toISOString(),
      description: `Complete: ${training.name}`,
      relatedTraining: training.id,
      remindersSent: [],
      escalations: [],
    }))

    try {
      const createdTasks = await Promise.all(
        tasksData.map((data) =>
          this.payload.create({
            collection: 'compliance_tasks',
            data,
          }),
        ),
      )

      await Promise.allSettled(
        createdTasks.map(async (task) => {
          try {
            await this.emailService.sendTaskCreatedEmail(task, user)
          } catch (error) {
            console.error('createTrainingTasks failed to send email for task', task.id, error)
          }
        }),
      )
    } catch (error) {
      throw error
    }
  }

  private async createRollCallTask(user: User): Promise<void> {
    if (!user.tenant) {
      throw new Error('User tenant is required')
    }
    const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant

    const dueDate = await this.getNextRollCallDate(tenantId)

    const task = await this.payload.create({
      collection: 'compliance_tasks',
      data: {
        type: ComplianceTaskType.USER_ROLL_CALL,
        assignedUser: user.id,
        tenant: tenantId,
        status: ComplianceTaskStatus.PENDING,
        dueDate: dueDate.toISOString(),
        description:
          'As part of governance, we periodically confirm that your role and assigned social media accounts are accurate.',
        remindersSent: [],
        escalations: [],
      },
    })

    try {
      await this.emailService.sendTaskCreatedEmail(task, user)
    } catch (error) {
      console.error('createRollCallTask failed to send email but task was created', error)
    }
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  private async getNextRollCallDate(tenantId: number): Promise<Date> {
    const tenant = await this.payload.findByID({
      collection: 'tenants',
      id: tenantId,
    })

    const frequency = tenant.governanceSettings?.rollCallFrequency || 'quarterly'

    const daysMap: Record<string, number> = {
      monthly: 30,
      quarterly: 90,
      semiannual: 180,
      annual: 365,
    }

    return this.addDays(new Date(), daysMap[frequency])
  }

  private async getRequiredTrainingsForUser(
    user: User,
  ): Promise<Array<{ id: string; name: string }>> {
    if (!user.tenant) {
      return []
    }

    const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant

    const tenant = await this.payload.findByID({
      collection: 'tenants',
      id: tenantId,
    })

    const userRoles = user.roles || []

    if (userRoles.length === 0) {
      return []
    }

    const roleMapping: Record<UserRolesEnum, string> = {
      [UserRolesEnum.SocialMediaManager]: 'social_media_manager',
      [UserRolesEnum.UnitAdmin]: 'unit_admin',
      [UserRolesEnum.CentralAdmin]: 'central_admin',
      [UserRolesEnum.SuperAdmin]: 'super_admin',
    }

    const mappedRoles = userRoles.map((role) => roleMapping[role as UserRolesEnum]).filter(Boolean)

    const enabledTrainings = (tenant.enabledTrainings || []) as Array<{
      trainingId: string
      assignedRoles: string[]
    }>

    const userTrainings = enabledTrainings
      .filter((training) => training.assignedRoles.some((role) => mappedRoles.includes(role)))
      .map((training) => ({
        id: training.trainingId,
        name: this.getTrainingNameById(training.trainingId),
      }))

    const uniqueTrainings = Array.from(new Map(userTrainings.map((t) => [t.id, t])).values())

    return uniqueTrainings
  }

  private getTrainingNameById(trainingId: string): string {
    const trainingNames: Record<string, string> = {
      'training-governance': 'Social Media Governance Essentials: Accessibility, Compliance & Risk',
      'training-risk': 'Social Media Risk Mitigation',
      'training-leadership': 'A Leadership Guide to Social Media Crisis Management',
    }

    return trainingNames[trainingId] || 'Required Training'
  }
}
