import { Endpoint } from 'payload'
import { parseSearchParamsWithSchema } from '@/shared'
import { createUserFormSchema, updateUserSchema } from '../schemas'
import { updateOrgAccessSchema, UserAccessTypeEnum } from '@/organization-access'

export const createUser: Endpoint = {
  path: '/',
  method: 'post',
  handler: async (req) => {
    try {
      if (!req.json)
        return new Response(JSON.stringify({ error: 'Missing JSON body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })

      const user = req.user
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const data = await req.json()

      if (data.organizations && !Array.isArray(data.organizations)) {
        data.organizations = [String(data.organizations)]
      }
      const dataParsed = createUserFormSchema.parse(data)
      const existingUser = await req.payload.find({
        collection: 'users',
        where: {
          email: {
            equals: data.email,
          },
        },
      })

      if (existingUser.docs.length > 0) {
        return new Response(
          JSON.stringify({
            message: 'A user with the given email is already registered.',
            details: existingUser.docs[0].id,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      const createUser = await req.payload.create({
        collection: 'users',
        data: {
          name: dataParsed.name,
          email: dataParsed.email,
          password: dataParsed.password,
          role: dataParsed.role,
          status: dataParsed.status,
          organizations: dataParsed.organizations?.map((org) => Number(org)),
          admin_policy_agreement: false,
        },
        req,
      })

      dataParsed.organizations?.map(async (org) => {
        await req.payload.create({
          collection: 'organization_access',
          data: {
            organization: Number(org),
            user: createUser.id,
            type: UserAccessTypeEnum.Permanent,
          },
        })
      })

      return new Response(JSON.stringify(createUser), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Error creating user:', error)
      return new Response(JSON.stringify({ error: 'Internal Server Error', details: error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}

export const updateUser: Endpoint = {
  path: '/',
  method: 'patch',
  handler: async (req) => {
    try {
      if (!req.json)
        return new Response(JSON.stringify({ error: 'Missing JSON body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })

      const user = req.user
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const data = await req.json()
      const dataParsed = parseSearchParamsWithSchema(data, updateUserSchema)

      const createUser = await req.payload.update({
        collection: 'users',
        id: dataParsed.id,
        data: {
          name: dataParsed.name,
          email: dataParsed.email,
          role: dataParsed.role,
          status: dataParsed.status,
          organizations: dataParsed.organizations?.map((org) => Number(org)),
          admin_policy_agreement: false,
        },
        req,
      })

      await req.payload.delete({
        collection: 'organization_access',
        where: {
          'user.id': {
            equals: dataParsed.id,
          },
        },
      })

      dataParsed.organizations?.map(async (org) => {
        await req.payload.create({
          collection: 'organization_access',
          data: {
            organization: Number(org),
            type: 'permanent',
          },
        })
      })

      return new Response(JSON.stringify(createUser), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Error creating organization:', error)
      return new Response(JSON.stringify({ error: 'Internal Server Error', details: error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}

export const updateUserAccess: Endpoint = {
  path: '/access',
  method: 'patch',
  handler: async (req) => {
    try {
      if (!req.json)
        return new Response(JSON.stringify({ error: 'Missing JSON body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })

      const user = req.user
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const data = await req.json()
      const dataParsed = parseSearchParamsWithSchema(data, updateOrgAccessSchema)
      dataParsed.access.map(async (access) => {
        await req.payload.update({
          collection: 'organization_access',
          id: access.id,
          data: {
            type: access.type,
            start_date: access.start_date,
            end_date: access.end_date,
          },
          req,
        })
      })

      return new Response(JSON.stringify(createUser), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Error updating access:', error)
      return new Response(JSON.stringify({ error: 'Internal Server Error', details: error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}

export const getOrganizationUsers: Endpoint = {
  path: '/',
  method: 'get',
  handler: async (req) => {
    try {
      const user = req.user
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const params = req.searchParams
      const limit = params.get('limit') ? Number(params.get('limit')) : 10
      const page = params.get('page') ? Number(params.get('page')) : 0

      const organizations = await req.payload.find({
        collection: 'organization',
        user,
        overrideAccess: false,
      })
      const orgIds = organizations.docs.map((org) => {
        return org.id
      })

      const users = await req.payload.find({
        collection: 'users',
        where: {
          'organizations.id': {
            in: orgIds,
          },
        },
        limit,
        page,
      })

      return new Response(JSON.stringify({ ...users }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Error getting users:', error)
      return new Response(JSON.stringify({ error: 'Internal Server Error', details: error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}
