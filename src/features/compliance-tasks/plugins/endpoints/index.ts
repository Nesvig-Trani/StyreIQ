import { Endpoint, PayloadRequest } from 'payload'
import { EndpointError } from '@/shared'
import { JSON_HEADERS } from '@/shared/constants'
import { ComplianceTaskStatus } from '../../schema'
import { AuditLogActionEnum } from '@/features/audit-log/plugins/types'
import { ComplianceTask, User } from '@/types/payload-types'

const validateAndGetTask = async (
  req: PayloadRequest,
  taskId: string,
): Promise<{ task: ComplianceTask; user: User }> => {
  if (!taskId) {
    throw new EndpointError('Task ID required', 400)
  }

  const user = req.user
  if (!user) {
    throw new EndpointError('Unauthorized', 401)
  }

  const task = await req.payload.findByID({
    collection: 'compliance_tasks',
    id: Number(taskId),
  })

  const assignedUserId =
    typeof task.assignedUser === 'object' ? task.assignedUser.id : task.assignedUser

  if (assignedUserId !== user.id) {
    throw new EndpointError('Not authorized to complete this task', 403)
  }

  return { task, user: user as User }
}

const completeTask = async (req: PayloadRequest, taskId: string): Promise<ComplianceTask> => {
  return await req.payload.update({
    collection: 'compliance_tasks',
    id: Number(taskId),
    data: {
      status: ComplianceTaskStatus.COMPLETED,
      completedAt: new Date().toISOString(),
    },
  })
}

const createAuditLog = async (
  req: PayloadRequest,
  user: User,
  action: AuditLogActionEnum,
  metadata: Record<string, unknown>,
): Promise<void> => {
  if (!user.tenant) {
    throw new EndpointError('User has no tenant assigned', 400)
  }

  const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant

  await req.payload.create({
    collection: 'audit_log',
    data: {
      user: user.id,
      action,
      entity: 'compliance_tasks',
      metadata,
      organizations: user.organizations || [],
      tenant: tenantId,
    },
  })
}

export const completeTaskEndpoint: Endpoint = {
  path: '/:id/complete',
  method: 'patch',
  handler: async (req) => {
    const taskId = req.routeParams?.id as string
    if (!req.json) {
      throw new EndpointError('Missing JSON body', 400)
    }

    const body = await req.json()
    const { notes } = body

    try {
      const { task, user } = await validateAndGetTask(req, taskId)
      const updatedTask = await completeTask(req, taskId)

      await createAuditLog(req, user, AuditLogActionEnum.TaskCompleted, {
        taskId,
        taskType: task.type,
        notes: notes || 'No additional notes',
        completedAt: new Date().toISOString(),
      })

      return new Response(JSON.stringify({ success: true, task: updatedTask }), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      if (error instanceof EndpointError) throw error
      throw new EndpointError('Failed to complete task', 500)
    }
  },
}

export const completePasswordSetupEndpoint: Endpoint = {
  path: '/:id/complete-password-setup',
  method: 'patch',
  handler: async (req) => {
    const taskId = req.routeParams?.id as string

    try {
      const { task, user } = await validateAndGetTask(req, taskId)
      const updatedTask = await completeTask(req, taskId)

      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: {
          isInUseSecurePassword: true,
          isEnabledTwoFactor: true,
          passwordUpdatedAt: new Date().toISOString(),
        },
      })

      await createAuditLog(req, user, AuditLogActionEnum.PasswordSetupCompleted, {
        taskId,
        taskType: task.type,
        confirmedSecurePassword: true,
        confirmed2FA: true,
      })

      return new Response(JSON.stringify({ success: true, task: updatedTask }), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      if (error instanceof EndpointError) throw error
      throw new EndpointError('Failed to complete password setup', 500)
    }
  },
}

export const completeUserPasswordEndpoint: Endpoint = {
  path: '/:id/complete-user-password',
  method: 'patch',
  handler: async (req) => {
    const taskId = req.routeParams?.id as string
    try {
      const { task, user } = await validateAndGetTask(req, taskId)
      const updatedTask = await completeTask(req, taskId)

      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: {
          isInUseSecurePassword: true,
          passwordUpdatedAt: new Date().toISOString(),
        },
      })

      await createAuditLog(req, user, AuditLogActionEnum.UserPasswordConfirmed, {
        taskId,
        taskType: task.type,
        confirmedSecurePassword: true,
      })

      return new Response(JSON.stringify({ success: true, task: updatedTask }), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      if (error instanceof EndpointError) throw error
      throw new EndpointError('Failed to complete user password confirmation', 500)
    }
  },
}

export const completeSharedPasswordEndpoint: Endpoint = {
  path: '/:id/complete-shared-password',
  method: 'patch',
  handler: async (req) => {
    const taskId = req.routeParams?.id as string

    try {
      const { task, user } = await validateAndGetTask(req, taskId)
      const updatedTask = await completeTask(req, taskId)

      await createAuditLog(req, user, AuditLogActionEnum.SharedPasswordConfirmed, {
        taskId,
        taskType: task.type,
        confirmedSharedPassword: true,
      })

      return new Response(JSON.stringify({ success: true, task: updatedTask }), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      if (error instanceof EndpointError) throw error
      throw new EndpointError('Failed to complete shared password confirmation', 500)
    }
  },
}

export const completeTwoFactorEndpoint: Endpoint = {
  path: '/:id/complete-2fa',
  method: 'patch',
  handler: async (req) => {
    const taskId = req.routeParams?.id as string

    try {
      const { task, user } = await validateAndGetTask(req, taskId)
      const updatedTask = await completeTask(req, taskId)

      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: {
          isEnabledTwoFactor: true,
        },
      })

      await createAuditLog(req, user, AuditLogActionEnum.TwoFAConfirmed, {
        taskId,
        taskType: task.type,
        confirmed2FA: true,
      })

      return new Response(JSON.stringify({ success: true, task: updatedTask }), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      if (error instanceof EndpointError) throw error
      throw new EndpointError('Failed to complete 2FA confirmation', 500)
    }
  },
}

export const completeTrainingEndpoint: Endpoint = {
  path: '/:id/complete-training',
  method: 'patch',
  handler: async (req) => {
    const taskId = req.routeParams?.id as string

    try {
      const { task, user } = await validateAndGetTask(req, taskId)
      const updatedTask = await completeTask(req, taskId)

      const updateData: Record<string, string | boolean> = {
        date_of_last_training: new Date().toISOString(),
      }

      const trainingFieldMap: Record<string, string> = {
        'training-accessibility': 'isCompletedTrainingAccessibility',
        'training-risk': 'isCompletedTrainingRisk',
        'training-brand': 'isCompletedTrainingBrand',
        'training-compliance': 'isCompletedTrainingCompliance',
        'training-governance': 'isCompletedTrainingGovernance',
      }

      if (task.relatedTraining && trainingFieldMap[task.relatedTraining]) {
        updateData[trainingFieldMap[task.relatedTraining]] = true
      }

      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: updateData,
      })

      await createAuditLog(req, user, AuditLogActionEnum.TrainingCompleted, {
        taskId,
        trainingId: task.relatedTraining,
        taskType: task.type,
        userFieldsUpdated: Object.keys(updateData).filter((k) => k !== 'date_of_last_training'),
      })

      return new Response(JSON.stringify({ success: true, task: updatedTask }), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      if (error instanceof EndpointError) throw error
      throw new EndpointError('Failed to complete training', 500)
    }
  },
}

export const completeRollCallEndpoint: Endpoint = {
  path: '/:id/complete-roll-call',
  method: 'patch',
  handler: async (req) => {
    const taskId = req.routeParams?.id as string

    try {
      const { task, user } = await validateAndGetTask(req, taskId)
      const updatedTask = await completeTask(req, taskId)

      await createAuditLog(req, user, AuditLogActionEnum.RollCallCompleted, {
        taskId,
        taskType: task.type,
        completedAt: new Date().toISOString(),
      })

      return new Response(JSON.stringify({ success: true, task: updatedTask }), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      if (error instanceof EndpointError) throw error
      throw new EndpointError('Failed to complete roll call', 500)
    }
  },
}
