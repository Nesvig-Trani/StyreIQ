import { Payload } from 'payload'
import { User } from '@/types/payload-types'
import { UserRolesEnum } from '@/features/users'
import { ComplianceTaskStatus, ComplianceTaskType } from '../schema'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

export class ComplianceTaskGenerator {
  constructor(private payload: Payload) {}

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

    await this.payload.create({
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

    await this.payload.create({
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

    await this.payload.create({
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
  }

  private async createPolicyAcknowledgmentTasks(user: User): Promise<void> {
    if (!user.tenant) {
      throw new Error('User tenant is required')
    }

    const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant

    const activePolicies = await this.payload.find({
      collection: 'policies',
      where: {
        tenant: { equals: tenantId },
      },
      limit: 0,
    })

    if (activePolicies.docs.length === 0) return

    const dueDate = this.addDays(new Date(), 14)

    const existingTasks = await this.payload.find({
      collection: 'compliance_tasks',
      where: {
        and: [
          { assignedUser: { equals: user.id } },
          { type: { equals: ComplianceTaskType.POLICY_ACKNOWLEDGMENT } },
          { status: { in: ['PENDING', 'OVERDUE'] } },
        ],
      },
      limit: 0,
    })

    const existingPolicyIds = new Set(
      existingTasks.docs.map((task) =>
        task.relatedPolicy && typeof task.relatedPolicy === 'object'
          ? task.relatedPolicy.id
          : task.relatedPolicy,
      ),
    )

    const policiesNeedingTasks = activePolicies.docs.filter(
      (policy) => !existingPolicyIds.has(policy.id),
    )

    if (policiesNeedingTasks.length === 0) return

    const tasksData = policiesNeedingTasks.map((policy) => ({
      type: ComplianceTaskType.POLICY_ACKNOWLEDGMENT,
      assignedUser: user.id,
      tenant: tenantId,
      status: ComplianceTaskStatus.PENDING,
      dueDate: dueDate.toISOString(),
      description: `Review and acknowledge policy version ${policy.version}`,
      relatedPolicy: policy.id,
      remindersSent: [],
      escalations: [],
    }))

    await Promise.all(
      tasksData.map((data) =>
        this.payload.create({
          collection: 'compliance_tasks',
          data,
        }),
      ),
    )
  }

  private async createTrainingTasks(user: User): Promise<void> {
    if (!user.tenant) {
      throw new Error('User tenant is required')
    }

    const effectiveRole = getEffectiveRoleFromUser(user)
    if (!effectiveRole) return

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

    const requiredTrainings = this.getRequiredTrainingsForRole(effectiveRole)

    if (requiredTrainings.length === 0) return

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

    if (trainingsNeedingTasks.length === 0) return

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

    await Promise.all(
      tasksData.map((data) =>
        this.payload.create({
          collection: 'compliance_tasks',
          data,
        }),
      ),
    )
  }

  private async createRollCallTask(user: User): Promise<void> {
    if (!user.tenant) {
      throw new Error('User tenant is required')
    }
    const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant

    const dueDate = await this.getNextRollCallDate(tenantId)

    await this.payload.create({
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

  private getRequiredTrainingsForRole(role: UserRolesEnum): Array<{ id: string; name: string }> {
    const trainingsByRole: Record<UserRolesEnum, Array<{ id: string; name: string }>> = {
      [UserRolesEnum.SocialMediaManager]: [
        { id: 'training-accessibility', name: 'Accessibility Training' },
        { id: 'training-risk', name: 'Social Media Risk Mitigation' },
        { id: 'training-brand', name: 'Brand Guidelines Training' },
      ],
      [UserRolesEnum.UnitAdmin]: [
        { id: 'training-compliance', name: 'Compliance Management Training' },
        { id: 'training-risk', name: 'Social Media Risk Mitigation' },
      ],
      [UserRolesEnum.CentralAdmin]: [
        { id: 'training-governance', name: 'Social Media Governance Essentials' },
      ],
      [UserRolesEnum.SuperAdmin]: [],
    }

    return trainingsByRole[role] || []
  }
}
