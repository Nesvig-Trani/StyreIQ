import { JSON_HEADERS } from '@/shared/constants'
import { UserRolesEnum } from '@/features/users/schemas'
import { getUsersByOrganizationAndRole, getUsersByRoles } from '@/features/users/plugins/queries'
import { Endpoint, Payload } from 'payload'
import { calcParentPathAndDepth } from '@/features/units/utils/calcPathAndDepth'
import { EndpointError } from '@/shared'
import { z } from 'zod'
import {
  extractTenantIdFromProperty,
  validateRelatedEntityTenant,
  validateTenantAccess,
} from '@/features/tenants/plugins/collections/helpers/access-control-helpers'

async function calculateUnitPathAndDepth(
  payload: Payload,
  unitId: number,
  parentOrg: number,
  name: string,
) {
  const { parentPath, parentDepth } = await calcParentPathAndDepth({
    payload,
    id: unitId,
    parentOrg,
    name,
  })

  const path = parentPath ? `${parentPath}/${unitId}` : `${unitId}`
  const depth = parentDepth + 1

  return { path, depth }
}

async function updateAdminOrganizations(payload: Payload, adminId: number, newOrgId: number) {
  const findAdmin = await payload.findByID({
    collection: 'users',
    id: adminId,
    depth: 0,
  })
  const organizations = findAdmin.organizations as number[]
  await payload.update({
    collection: 'users',
    id: adminId,
    data: {
      organizations: Array.from(new Set([...organizations, newOrgId])),
    },
  })
}

export const createUnit: Endpoint = {
  path: '/',
  method: 'post',
  handler: async (req) => {
    try {
      if (!req.json)
        return new Response(JSON.stringify({ error: 'Missing JSON body' }), {
          status: 400,
          headers: JSON_HEADERS,
        })

      const user = req.user
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: JSON_HEADERS,
        })
      }
      const data = await req.json()

      const { parentOrg, name, admin } = data

      const tenantCheck = validateTenantAccess({
        req,
        targetTenantId: data.tenant,
        entityName: 'unit',
      })

      if (!tenantCheck.valid) {
        return new Response(JSON.stringify({ error: tenantCheck.error!.message }), {
          status: tenantCheck.error!.status,
          headers: JSON_HEADERS,
        })
      }

      if (!data.tenant) {
        data.tenant = tenantCheck.userTenant
      }

      if (user.role !== UserRolesEnum.SuperAdmin && !parentOrg) {
        return new Response(
          JSON.stringify({ error: 'parentOrg is required for non-super_admin users' }),
          {
            status: 400,
            headers: JSON_HEADERS,
          },
        )
      }

      if (parentOrg) {
        const parentCheck = await validateRelatedEntityTenant({
          req,
          collection: 'organization',
          entityId: parentOrg,
          entityName: 'Parent organization',
        })

        if (!parentCheck.valid) {
          return new Response(JSON.stringify({ error: parentCheck.error!.message }), {
            status: parentCheck.error!.status,
            headers: JSON_HEADERS,
          })
        }
      }

      const createOrganization = await req.payload.create({
        collection: 'organization',
        data,
        req,
      })

      const currentId = createOrganization.id

      const { path, depth } = await calculateUnitPathAndDepth(
        req.payload,
        currentId,
        parentOrg,
        name,
      )

      await req.payload.update({
        collection: 'organization',
        id: currentId,
        data: {
          path: path,
          depth,
        },
      })

      await updateAdminOrganizations(req.payload, admin, createOrganization.id)

      return new Response(JSON.stringify(createOrganization), {
        status: 201,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      console.error('Error creating organization:', error)
      return new Response(
        JSON.stringify({ error: 'Error creating organizations', details: error }),
        {
          status: 400,
          headers: JSON_HEADERS,
        },
      )
    }
  },
}

export const updateUnit: Endpoint = {
  path: '/',
  method: 'patch',
  handler: async (req) => {
    try {
      if (!req.json)
        return new Response(JSON.stringify({ error: 'Missing JSON body' }), {
          status: 400,
          headers: JSON_HEADERS,
        })

      const user = req.user
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: JSON_HEADERS,
        })
      }
      const data = await req.json()
      const { id, parentOrg, name, admin } = data

      const targetUnit = await req.payload.findByID({
        collection: 'organization',
        id: id,
      })

      if (!targetUnit) {
        return new Response(JSON.stringify({ error: 'Unit not found' }), {
          status: 404,
          headers: JSON_HEADERS,
        })
      }

      const tenantId = extractTenantIdFromProperty(targetUnit.tenant)

      const tenantCheck = validateTenantAccess({
        req,
        targetTenantId: tenantId,
        entityName: 'unit',
      })

      if (!tenantCheck.valid) {
        return new Response(JSON.stringify({ error: tenantCheck.error!.message }), {
          status: tenantCheck.error!.status,
          headers: JSON_HEADERS,
        })
      }

      if (data.tenant && data.tenant !== user.tenant && user.role !== UserRolesEnum.SuperAdmin) {
        return new Response(JSON.stringify({ error: 'Cannot change unit tenant' }), {
          status: 403,
          headers: JSON_HEADERS,
        })
      }

      if (parentOrg) {
        const parentCheck = await validateRelatedEntityTenant({
          req,
          collection: 'organization',
          entityId: parentOrg,
          entityName: 'Parent organization',
        })

        if (!parentCheck.valid) {
          return new Response(JSON.stringify({ error: parentCheck.error!.message }), {
            status: parentCheck.error!.status,
            headers: JSON_HEADERS,
          })
        }
      }

      if (user.role !== UserRolesEnum.SuperAdmin && !parentOrg) {
        return new Response(
          JSON.stringify({ error: 'parentOrg is required for non-super_admin users' }),
          {
            status: 400,
            headers: JSON_HEADERS,
          },
        )
      }

      const { path, depth } = await calculateUnitPathAndDepth(req.payload, id, parentOrg, name)

      await req.payload.update({
        collection: 'organization',
        where: { id: { equals: id } },
        data: {
          ...data,
          path: path,
          depth,
        },
        req,
      })

      await updateAdminOrganizations(req.payload, admin, id)

      return new Response(JSON.stringify(createUnit), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      console.error('Error updating organization:', error)
      return new Response(
        JSON.stringify({ error: 'Error updating organization', details: error }),
        {
          status: 400,
          headers: JSON_HEADERS,
        },
      )
    }
  },
}

export const disableUnit: Endpoint = {
  path: '/disable/:id',
  method: 'put',
  handler: async (req) => {
    try {
      if (!req.routeParams?.id) {
        throw new EndpointError('Organization not found.', 404)
      }
      const user = req.user
      if (!user || user.role !== UserRolesEnum.SuperAdmin) {
        throw new EndpointError('Unauthorized', 401)
      }
      const { id } = req.routeParams
      const unitId = typeof id === 'string' ? parseInt(id) : Number(id)
      const targetUnit = await req.payload.findByID({
        collection: 'organization',
        id: unitId,
      })

      if (!targetUnit) {
        throw new EndpointError('Organization not found', 404)
      }

      const tenantId = extractTenantIdFromProperty(targetUnit.tenant)

      const tenantCheck = validateTenantAccess({
        req,
        targetTenantId: tenantId,
        entityName: 'unit',
      })

      if (!tenantCheck.valid) {
        throw new EndpointError(tenantCheck.error!.message, tenantCheck.error!.status)
      }

      const disabledOrg = await req.payload.update({
        collection: 'organization',
        where: { id: { equals: id } },
        data: {
          disabled: true,
        },
      })

      return new Response(JSON.stringify(disabledOrg), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: JSON_HEADERS,
        })
      }
      if (error instanceof EndpointError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.code,
          headers: JSON_HEADERS,
        })
      }

      return new Response(JSON.stringify({ error: 'Internal Server Error', details: error }), {
        status: 500,
        headers: JSON_HEADERS,
      })
    }
  },
}

export const filteredUsers: Endpoint = {
  path: '/filtered-users',
  method: 'get',
  handler: async (req) => {
    try {
      const { parentOrgId, parentOrgName } = req.query
      let users

      if (parentOrgName === 'StyreIQ') {
        // If StyreIQ is selected, get all Super Admins
        users = await getUsersByRoles([UserRolesEnum.SuperAdmin])
      } else if (parentOrgId) {
        // If other organization is selected, get Unit Admins of that organization
        users = await getUsersByOrganizationAndRole({
          organizationId: parseInt(parentOrgId as string),
          roles: [UserRolesEnum.UnitAdmin],
        })
      } else {
        // Default: return empty array
        users = { docs: [] }
      }
      return new Response(JSON.stringify(users), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      console.error('Error fetching filtered users:', error)
      return new Response(
        JSON.stringify({ error: 'Error fetching filtered users', details: error }),
        {
          status: 400,
          headers: JSON_HEADERS,
        },
      )
    }
  },
}
