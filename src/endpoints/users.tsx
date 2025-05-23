import { Endpoint } from 'payload'

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
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          status: data.status,
          organization: Number(data.organization),
          admin_policy_agreement: false,
        },
        req,
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
