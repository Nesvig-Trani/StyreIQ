import { Endpoint } from 'payload'
import { EndpointError } from '@/shared'
import { JSON_HEADERS } from '@/shared/constants'
import { ComplianceTaskStatus } from '../../schema'
import { AuditLogActionEnum } from '@/features/audit-log/plugins/types'

export const completeTaskEndpoint: Endpoint = {
  path: '/:id/complete',
  method: 'patch',
  handler: async (req) => {
    const taskId = req.routeParams?.id
    if (!taskId) {
      throw new EndpointError('Task ID required', 400)
    }

    const user = req.user
    if (!user) {
      throw new EndpointError('Unauthorized', 401)
    }

    if (!req.json) {
      throw new EndpointError('Missing JSON body', 400)
    }

    const body = await req.json()
    const { notes } = body

    try {
      const task = await req.payload.findByID({
        collection: 'compliance_tasks',
        id: Number(taskId),
      })

      const assignedUserId =
        typeof task.assignedUser === 'object' ? task.assignedUser.id : task.assignedUser

      if (assignedUserId !== user.id) {
        throw new EndpointError('Not authorized to complete this task', 403)
      }

      const updatedTask = await req.payload.update({
        collection: 'compliance_tasks',
        id: Number(taskId),
        data: {
          status: ComplianceTaskStatus.COMPLETED,
          completedAt: new Date().toISOString(),
        },
      })

      const tenantId = user.tenant && typeof user.tenant === 'object' ? user.tenant.id : user.tenant

      await req.payload.create({
        collection: 'audit_log',
        data: {
          user: user.id,
          action: 'task_completed',
          entity: 'compliance_tasks',
          metadata: {
            taskId,
            taskType: task.type,
            notes: notes || 'No additional notes',
            completedAt: new Date().toISOString(),
          },
          organizations: user.organizations || [],
          tenant: tenantId,
        },
      })

      return new Response(
        JSON.stringify({
          success: true,
          task: updatedTask,
        }),
        {
          status: 200,
          headers: JSON_HEADERS,
        },
      )
    } catch (error) {
      if (error instanceof EndpointError) {
        throw error
      }
      throw new EndpointError('Failed to complete task', 500)
    }
  },
}

export const completePasswordSetupEndpoint: Endpoint = {
  path: '/:id/complete-password-setup',
  method: 'patch',
  handler: async (req) => {
    const taskId = req.routeParams?.id
    if (!taskId) {
      throw new EndpointError('Task ID required', 400)
    }

    const user = req.user
    if (!user) {
      throw new EndpointError('Unauthorized', 401)
    }

    try {
      const task = await req.payload.findByID({
        collection: 'compliance_tasks',
        id: Number(taskId),
      })

      const assignedUserId =
        typeof task.assignedUser === 'object' ? task.assignedUser.id : task.assignedUser

      if (assignedUserId !== user.id) {
        throw new EndpointError('Not authorized to complete this task', 403)
      }

      const updatedTask = await req.payload.update({
        collection: 'compliance_tasks',
        id: Number(taskId),
        data: {
          status: ComplianceTaskStatus.COMPLETED,
          completedAt: new Date().toISOString(),
        },
      })

      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: {
          isInUseSecurePassword: true,
          isEnabledTwoFactor: true,
          passwordUpdatedAt: new Date().toISOString(),
        },
      })

      if (!user.tenant) {
        throw new EndpointError('User has no tenant assigned', 400)
      }

      const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant

      await req.payload.create({
        collection: 'audit_log',
        data: {
          user: user.id,
          action: AuditLogActionEnum.PasswordSetupCompleted,
          entity: 'compliance_tasks',
          metadata: {
            taskId,
            taskType: task.type,
            confirmedSecurePassword: true,
            confirmed2FA: true,
          },
          organizations: user.organizations || [],
          tenant: tenantId,
        },
      })

      return new Response(
        JSON.stringify({
          success: true,
          task: updatedTask,
        }),
        {
          status: 200,
          headers: JSON_HEADERS,
        },
      )
    } catch (error) {
      if (error instanceof EndpointError) {
        throw error
      }

      throw new EndpointError('Failed to complete password setup', 500)
    }
  },
}

export const completeTrainingEndpoint: Endpoint = {
  path: '/:id/complete-training',
  method: 'patch',
  handler: async (req) => {
    const taskId = req.routeParams?.id
    if (!taskId) {
      throw new EndpointError('Task ID required', 400)
    }

    const user = req.user
    if (!user) {
      throw new EndpointError('Unauthorized', 401)
    }

    try {
      const task = await req.payload.findByID({
        collection: 'compliance_tasks',
        id: Number(taskId),
      })

      const assignedUserId =
        typeof task.assignedUser === 'object' ? task.assignedUser.id : task.assignedUser

      if (assignedUserId !== user.id) {
        throw new EndpointError('Not authorized to complete this task', 403)
      }

      const updatedTask = await req.payload.update({
        collection: 'compliance_tasks',
        id: Number(taskId),
        data: {
          status: ComplianceTaskStatus.COMPLETED,
          completedAt: new Date().toISOString(),
        },
      })

      const updateData: Record<string, string | boolean> = {
        date_of_last_training: new Date().toISOString(),
      }

      if (task.relatedTraining === 'training-accessibility') {
        updateData.isCompletedTrainingAccessibility = true
      } else if (task.relatedTraining === 'training-risk') {
        updateData.isCompletedTrainingRisk = true
      } else if (task.relatedTraining === 'training-brand') {
        updateData.isCompletedTrainingBrand = true
      } else if (task.relatedTraining === 'training-compliance') {
        updateData.isCompletedTrainingCompliance = true
      } else if (task.relatedTraining === 'training-governance') {
        updateData.isCompletedTrainingGovernance = true
      }

      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: updateData,
      })

      if (!user.tenant) {
        throw new EndpointError('User has no tenant assigned', 400)
      }

      const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant

      await req.payload.create({
        collection: 'audit_log',
        data: {
          user: user.id,
          action: AuditLogActionEnum.TrainingCompleted,
          entity: 'compliance_tasks',
          metadata: {
            taskId,
            trainingId: task.relatedTraining,
            taskType: task.type,
            userFieldsUpdated: Object.keys(updateData).filter((k) => k !== 'date_of_last_training'),
          },
          organizations: user.organizations || [],
          tenant: tenantId,
        },
      })

      return new Response(
        JSON.stringify({
          success: true,
          task: updatedTask,
        }),
        {
          status: 200,
          headers: JSON_HEADERS,
        },
      )
    } catch (error) {
      if (error instanceof EndpointError) {
        throw error
      }

      throw new EndpointError('Failed to complete training', 500)
    }
  },
}

export const completeRollCallEndpoint: Endpoint = {
  path: '/:id/complete-roll-call',
  method: 'patch',
  handler: async (req) => {
    const taskId = req.routeParams?.id
    if (!taskId) {
      throw new EndpointError('Task ID required', 400)
    }

    const user = req.user
    if (!user) {
      throw new EndpointError('Unauthorized', 401)
    }

    try {
      const task = await req.payload.findByID({
        collection: 'compliance_tasks',
        id: Number(taskId),
      })

      const assignedUserId =
        typeof task.assignedUser === 'object' ? task.assignedUser.id : task.assignedUser

      if (assignedUserId !== user.id) {
        throw new EndpointError('Not authorized to complete this task', 403)
      }

      const updatedTask = await req.payload.update({
        collection: 'compliance_tasks',
        id: Number(taskId),
        data: {
          status: ComplianceTaskStatus.COMPLETED,
          completedAt: new Date().toISOString(),
        },
      })

      if (!user.tenant) {
        throw new EndpointError('User has no tenant assigned', 400)
      }

      const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant

      await req.payload.create({
        collection: 'audit_log',
        data: {
          user: user.id,
          action: AuditLogActionEnum.RollCallCompleted,
          entity: 'compliance_tasks',
          metadata: {
            taskId,
            taskType: task.type,
            completedAt: new Date().toISOString(),
          },
          organizations: user.organizations || [],
          tenant: tenantId,
        },
      })

      return new Response(
        JSON.stringify({
          success: true,
          task: updatedTask,
        }),
        {
          status: 200,
          headers: JSON_HEADERS,
        },
      )
    } catch (error) {
      if (error instanceof EndpointError) {
        throw error
      }

      throw new EndpointError('Failed to complete roll call', 500)
    }
  },
}
