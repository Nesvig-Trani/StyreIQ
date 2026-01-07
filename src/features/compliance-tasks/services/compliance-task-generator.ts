import { Payload } from 'payload'
import { User } from '@/types/payload-types'
import { UserRolesEnum } from '@/features/users'
import { ComplianceTaskStatus, ComplianceTaskType } from '../schema'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

export class ComplianceTaskGenerator {
  constructor(private payload: Payload) {}

  async generateTasksForNewUser(user: User): Promise<void> {
    if (!user.tenant) {
      throw new Error(`Cannot generate compliance tasks: User ${user.id} has no tenant assigned`)
    }

    try {
      await this.createUserPasswordTask(user)
      await this.createTwoFactorTask(user)
      await this.createSharedPasswordTaskIfNeeded(user)

      await this.createPolicyAcknowledgmentTasks(user)

      await this.createTrainingTasks(user)

      await this.createRollCallTask(user)
    } catch (error) {
      throw error
    }
  }

  private async createUserPasswordTask(user: User): Promise<void> {
    if (!user.tenant) {
      throw new Error('User tenant is required')
    }

    const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant
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
          'Confirm that you have updated your user password according to organizational requirements.',
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
          'Confirm that two-factor authentication (2FA) is enabled on all assigned social media accounts.',
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

    await this.payload.find({
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
          'Confirm that the shared account password has been changed and redistributed securely.',
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

    const tasksData = activePolicies.docs.map((policy) => ({
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

    const tasksData = requiredTrainings.map((training) => ({
      type: ComplianceTaskType.TRAINING_COMPLETION,
      assignedUser: user.id,
      tenant: tenantId,
      status: ComplianceTaskStatus.PENDING,
      dueDate: dueDate.toISOString(),
      description: `Complete required training: ${training.name}`,
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
        description: 'Confirm your continued role and account access.',
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
        { id: 'training-risk', name: 'Risk Management Training' },
        { id: 'training-brand', name: 'Brand Guidelines Training' },
      ],
      [UserRolesEnum.UnitAdmin]: [
        { id: 'training-compliance', name: 'Compliance Management Training' },
        { id: 'training-risk', name: 'Risk Management Training' },
      ],
      [UserRolesEnum.CentralAdmin]: [
        { id: 'training-governance', name: 'Governance & Policy Training' },
      ],
      [UserRolesEnum.SuperAdmin]: [],
    }

    return trainingsByRole[role] || []
  }
}
