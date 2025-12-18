import { Endpoint } from 'payload'
import { UserRolesEnum } from '@/features/users'
import { UserAccessTypeEnum } from '@/features/units/schemas'
import { AuditLogActionEnum } from '@/features/audit-log/plugins/types'
import {
  getEffectiveRole,
  normalizeActiveRole,
  normalizeRoles,
} from '@/shared/utils/role-hierarchy'
import {
  extractTenantIdFromProperty,
  getSelectedTenantFromRequest,
} from '@/features/tenants/plugins/collections/helpers/access-control-helpers'

export const createRoleRequest: Endpoint = {
  path: '/',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!req.json) {
      return Response.json({ error: 'Missing JSON body' }, { status: 400 })
    }

    const body = await req.json()

    const { requestedRole, organization, justification } = body

    const currentRoles = normalizeRoles(req.user.roles)

    if (currentRoles.includes(requestedRole)) {
      return Response.json({ error: 'You already have this role' }, { status: 400 })
    }

    if (requestedRole === UserRolesEnum.SuperAdmin) {
      return Response.json({ error: 'Cannot request SuperAdmin role' }, { status: 400 })
    }

    const effectiveRole = getEffectiveRole(
      normalizeRoles(req.user.roles),
      normalizeActiveRole(req.user.active_role),
    )

    let tenantId: number | null = null

    if (effectiveRole === UserRolesEnum.SuperAdmin) {
      tenantId = getSelectedTenantFromRequest(req)

      if (!tenantId) {
        return Response.json({ error: 'SuperAdmin must select a tenant first' }, { status: 400 })
      }
    } else {
      tenantId = extractTenantIdFromProperty(req.user.tenant)

      if (!tenantId) {
        return Response.json({ error: 'User has no tenant assigned' }, { status: 400 })
      }
    }

    try {
      const roleRequest = await req.payload.create({
        collection: 'role-requests',
        data: {
          user: req.user.id,
          requestedRole,
          unitId: Number(organization),
          justification,
          status: 'pending',
          tenant: tenantId,
        },
      })

      return Response.json(
        {
          success: true,
          message: 'Role request submitted successfully',
          data: roleRequest,
        },
        { status: 201 },
      )
    } catch (error) {
      return Response.json(
        {
          error: 'Failed to create role request',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  },
}

export const approveRoleRequest: Endpoint = {
  path: '/:id/approve',
  method: 'post',
  handler: async (req) => {
    const { id } = req.routeParams as { id: string }

    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!req.json) {
      return Response.json({ error: 'Missing JSON body' }, { status: 400 })
    }

    const roles = normalizeRoles(req.user.roles)
    const activeRole = normalizeActiveRole(req.user.active_role)
    const effectiveRole = getEffectiveRole(roles, activeRole)

    const canApprove = [UserRolesEnum.SuperAdmin, UserRolesEnum.CentralAdmin].includes(
      effectiveRole,
    )

    if (!canApprove) {
      return Response.json(
        { error: 'Only SuperAdmin or CentralAdmin can approve role requests' },
        { status: 403 },
      )
    }

    const body = await req.json()
    const { approved, reviewNotes } = body

    const roleRequest = await req.payload.findByID({
      collection: 'role-requests',
      id,
    })

    if (roleRequest.status !== 'pending') {
      return Response.json({ error: 'This request has already been processed' }, { status: 400 })
    }

    if (!approved) {
      await req.payload.update({
        collection: 'role-requests',
        id,
        data: {
          status: 'rejected',
          approvedBy: req.user.id,
          reviewNotes,
        },
      })

      return Response.json({
        success: true,
        message: 'Role request rejected',
      })
    }

    const userId = typeof roleRequest.user === 'object' ? roleRequest.user.id : roleRequest.user

    const user = await req.payload.findByID({
      collection: 'users',
      id: userId,
    })

    const currentRoles = normalizeRoles(user.roles)

    if (currentRoles.includes(roleRequest.requestedRole as UserRolesEnum)) {
      return Response.json({ error: 'User already has this role' }, { status: 400 })
    }

    const updatedRoles = [...currentRoles, roleRequest.requestedRole as UserRolesEnum]

    const currentOrgs = (user.organizations || []).map((org) =>
      typeof org === 'object' ? org.id : org,
    )
    const updatedOrgs = [...currentOrgs]

    if (roleRequest.unitId) {
      const unitId =
        typeof roleRequest.unitId === 'object' ? roleRequest.unitId.id : roleRequest.unitId

      if (!updatedOrgs.includes(unitId)) {
        updatedOrgs.push(unitId)
      }
    }

    await req.payload.update({
      collection: 'users',
      id: userId,
      data: {
        roles: updatedRoles,
        organizations: updatedOrgs,
      },
    })

    if (roleRequest.unitId) {
      const unitId =
        typeof roleRequest.unitId === 'object' ? roleRequest.unitId.id : roleRequest.unitId

      await req.payload.create({
        collection: 'organization_access',
        data: {
          organization: unitId,
          user: userId,
          type: UserAccessTypeEnum.Permanent,
        },
      })
    }

    await req.payload.update({
      collection: 'role-requests',
      id,
      data: {
        status: 'approved',
        approvedBy: req.user.id,
        reviewNotes,
      },
    })

    await req.payload.create({
      collection: 'audit_log',
      data: {
        user: req.user.id,
        action: AuditLogActionEnum.RoleRequestApproved,
        entity: 'role-requests',
        metadata: {
          requestId: id,
          userId,
          grantedRole: roleRequest.requestedRole,
          unitId: roleRequest.unitId,
          newRoles: updatedRoles,
        },
        tenant: user.tenant,
      },
    })

    return Response.json({
      success: true,
      message: 'Role request approved successfully',
      data: {
        userId,
        newRoles: updatedRoles,
      },
    })
  },
}
