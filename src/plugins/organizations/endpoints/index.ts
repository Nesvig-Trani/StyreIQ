import { JSON_HEADERS } from '@/shared/constants'
import { UserRolesEnum } from '@/users/schemas'
import { Endpoint } from 'payload'
import { calcParentPathAndDepth } from '@/organizations/utils/calcPathAndDepth'
import { EndpointError } from '@/shared'
import { z } from 'zod'

export const createOrganization: Endpoint = {
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

      if (user.role !== UserRolesEnum.SuperAdmin && !parentOrg) {
        return new Response(
          JSON.stringify({ error: 'parentOrg is required for non-super_admin users' }),
          {
            status: 400,
            headers: JSON_HEADERS,
          },
        )
      }

      const createOrganization = await req.payload.create({
        collection: 'organization',
        data,
        req,
      })

      const currentId = createOrganization.id

      const { parentPath, parentDepth } = await calcParentPathAndDepth({
        payload: req.payload,
        id: createOrganization.id,
        parentOrg,
        name,
      })
      const path = parentPath ? `${parentPath}/${currentId}` : `${currentId}`
      const depth = parentDepth + 1

      await req.payload.update({
        collection: 'organization',
        id: currentId,
        data: {
          path: path,
          depth,
        },
      })

      const findAdmin = await req.payload.findByID({
        collection: 'users',
        id: admin,
        depth: 0,
      })
      const organizations = findAdmin.organizations as number[]
      await req.payload.update({
        collection: 'users',
        id: admin,
        data: {
          organizations: [...organizations, createOrganization.id],
        },
      })

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

export const updateOrganization: Endpoint = {
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

      if (user.role !== UserRolesEnum.SuperAdmin && !parentOrg) {
        return new Response(
          JSON.stringify({ error: 'parentOrg is required for non-super_admin users' }),
          {
            status: 400,
            headers: JSON_HEADERS,
          },
        )
      }

      const { parentPath, parentDepth } = await calcParentPathAndDepth({
        payload: req.payload,
        id,
        parentOrg,
        name,
      })

      const path = parentPath ? `${parentPath}/${id}` : `${id}`
      const depth = parentDepth + 1

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

      const findAdmin = await req.payload.findByID({ collection: 'users', id: admin, depth: 0 })
      const organizations = findAdmin.organizations as number[]
      await req.payload.update({
        collection: 'users',
        id: admin,
        data: {
          organizations: Array.from(new Set([...organizations, id])),
        },
      })

      return new Response(JSON.stringify(createOrganization), {
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

export const disableOrganization: Endpoint = {
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
