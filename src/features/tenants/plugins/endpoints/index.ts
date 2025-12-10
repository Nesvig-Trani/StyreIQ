import { Endpoint } from 'payload'
import { UserRolesEnum } from '@/features/users'
import { EndpointError } from '@/shared'
import { JSON_HEADERS } from '@/shared/constants'
import { extractTenantId } from '../collections/helpers/access-control-helpers'
import { Tenant, ComplianceTask } from '@/types/payload-types'
import { createTenantSchema } from '../../schemas'
import { UnitTypeEnum } from '@/features/units'
import { AuditLogActionEnum } from '@/features/audit-log/plugins/types'

export const createTenant: Endpoint = {
  path: '/',
  method: 'post',
  handler: async (req) => {
    if (!req.json) {
      throw new EndpointError('Missing JSON body', 400)
    }

    const user = req.user
    if (!user) {
      throw new EndpointError('Unauthorized', 401)
    }

    if (user.role !== UserRolesEnum.SuperAdmin) {
      throw new EndpointError('Only Super Admins can create tenants', 403)
    }

    const data = await req.json()
    const dataParsed = createTenantSchema.parse(data)

    const existingTenant = await req.payload.find({
      collection: 'tenants',
      where: {
        domain: {
          equals: dataParsed.domain,
        },
      },
      limit: 1,
    })

    if (existingTenant.docs.length > 0) {
      throw new EndpointError('A tenant with this domain already exists', 409)
    }

    const tenant = await req.payload.create({
      collection: 'tenants',
      data: {
        name: dataParsed.name,
        domain: dataParsed.domain,
        adminContact: dataParsed.adminContact,
        status: 'active',
        metadata: {
          timezone: dataParsed.timezone || 'America/New_York',
          notes: dataParsed.notes || '',
        },
        governanceSettings: {
          policyReminderDays: [{ day: 3 }, { day: 7 }, { day: 14 }],
          trainingEscalationDays: [{ day: 15 }, { day: 30 }, { day: 45 }],
          rollCallFrequency: 'quarterly',
          passwordRotationDays: 90,
        },
      },
    })

    await new Promise((resolve) => setTimeout(resolve, 500))

    const primaryUnit = await req.payload.create({
      collection: 'organization',
      data: {
        name: `${tenant.name} - Primary Unit`,
        tenant: tenant.id,
        isPrimaryUnit: true,
        parentOrg: null,
        status: 'active',
        type: UnitTypeEnum.DEPARTMENT,
      },
      overrideAccess: true,
    })

    await req.payload.update({
      collection: 'tenants',
      id: tenant.id,
      data: {
        primaryUnit: primaryUnit.id,
      },
    })

    await req.payload.create({
      collection: 'audit_log',
      data: {
        user: user.id,
        action: AuditLogActionEnum.Create,
        entity: 'tenants',
        metadata: {
          tenantName: tenant.name,
          tenantDomain: tenant.domain,
        },
        tenant: tenant.id,
      },
    })

    return new Response(JSON.stringify(tenant), {
      status: 201,
      headers: JSON_HEADERS,
    })
  },
}

export const getTenantMetrics: Endpoint = {
  path: '/:id/metrics',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: JSON_HEADERS,
      })
    }

    const requestedTenantId = Number(req.routeParams?.id)
    const userTenantId = extractTenantId(req.user)

    if (req.user.role !== UserRolesEnum.SuperAdmin && userTenantId !== requestedTenantId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: JSON_HEADERS,
      })
    }

    const userCountResult = await req.payload.count({
      collection: 'users',
      where: { tenant: { equals: requestedTenantId } },
    })

    const unitsCountResult = await req.payload.count({
      collection: 'organization',
      where: { tenant: { equals: requestedTenantId } },
    })

    const tasks = await req.payload.find({
      collection: 'compliance_tasks',
      where: { tenant: { equals: requestedTenantId } },
      limit: 0,
    })

    const completedTasks = tasks.docs.filter((t) => t.status === 'COMPLETED').length
    const completionRate =
      tasks.totalDocs > 0 ? Math.round((completedTasks / tasks.totalDocs) * 100) : 0

    return new Response(
      JSON.stringify({
        totalUsers: userCountResult.totalDocs,
        totalUnits: unitsCountResult.totalDocs,
        totalTasks: tasks.totalDocs,
        completedTasks,
        completionRate,
      }),
      {
        status: 200,
        headers: JSON_HEADERS,
      },
    )
  },
}

export const getAggregateMetrics: Endpoint = {
  path: '/aggregate-metrics',
  method: 'get',
  handler: async (req) => {
    if (!req.user || req.user.role !== UserRolesEnum.SuperAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: JSON_HEADERS,
      })
    }

    const tenants = await req.payload.find({
      collection: 'tenants',
      where: { status: { equals: 'active' } },
      limit: 0,
    })

    const metrics = await Promise.all(
      tenants.docs.map(async (tenant: Tenant) => {
        try {
          const userCountResult = await req.payload.count({
            collection: 'users',
            where: { tenant: { equals: tenant.id } },
          })

          const tasks = await req.payload.find({
            collection: 'compliance_tasks',
            where: { tenant: { equals: tenant.id } },
            limit: 0,
          })

          const completedTasks = tasks.docs.filter(
            (t: ComplianceTask) => t.status === 'COMPLETED',
          ).length

          const completionRate = tasks.totalDocs > 0 ? (completedTasks / tasks.totalDocs) * 100 : 0

          return {
            userCount: userCountResult.totalDocs,
            totalTasks: tasks.totalDocs,
            completedTasks,
            completionRate: Math.round(completionRate),
          }
        } catch (error) {
          console.error(`Failed to get metrics for tenant ${tenant.id}:`, error)
          return {
            userCount: 0,
            totalTasks: 0,
            completedTasks: 0,
            completionRate: 0,
          }
        }
      }),
    )

    const response = {
      totalTenants: tenants.totalDocs,
      aggregateMetrics: {
        totalUsers: metrics.reduce((sum, m) => sum + m.userCount, 0),
        totalTasks: metrics.reduce((sum, m) => sum + m.totalTasks, 0),
        totalCompletedTasks: metrics.reduce((sum, m) => sum + m.completedTasks, 0),
        averageCompletionRate:
          metrics.length > 0
            ? Math.round(metrics.reduce((sum, m) => sum + m.completionRate, 0) / metrics.length)
            : 0,
      },
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: JSON_HEADERS,
    })
  },
}

export const updateGovernanceSettings: Endpoint = {
  path: '/:id/governance',
  method: 'patch',
  handler: async (req) => {
    if (!req.routeParams?.id) {
      throw new EndpointError('Tenant ID required', 400)
    }

    const user = req.user

    if (!user || user.role !== UserRolesEnum.CentralAdmin) {
      throw new EndpointError('Only Central Admin can modify governance settings', 403)
    }

    const targetTenantId = Number(req.routeParams.id)
    const userTenantId = extractTenantId(user)

    if (!userTenantId || userTenantId !== targetTenantId) {
      throw new EndpointError('Cannot modify other tenant settings', 403)
    }

    if (!req.json) {
      throw new EndpointError('Missing JSON body', 400)
    }

    const data = await req.json()

    const updated = await req.payload.update({
      collection: 'tenants',
      id: targetTenantId,
      data: {
        governanceSettings: {
          policyReminderDays: data.policyReminderDays || [{ day: 3 }, { day: 7 }, { day: 14 }],
          trainingEscalationDays: data.trainingEscalationDays || [
            { day: 15 },
            { day: 30 },
            { day: 45 },
          ],
          rollCallFrequency: data.rollCallFrequency || 'quarterly',
          passwordRotationDays: data.passwordRotationDays || 90,
        },
      },
    })

    await req.payload.create({
      collection: 'audit_log',
      data: {
        user: user.id,
        action: 'update',
        entity: 'tenants',
        metadata: {
          section: 'governanceSettings',
          updatedBy: user.id,
          changes: data,
        },
        tenant: targetTenantId,
      },
    })

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: JSON_HEADERS,
    })
  },
}
