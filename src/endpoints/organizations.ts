import { Endpoint } from 'payload'

export const createOrganization: Endpoint = {
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
      if (user.role !== 'super_admin' && !data.parentOrg) {
        return new Response(
          JSON.stringify({ error: 'parentOrg is required for non-super_admin users' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      if (data.parentOrg) {
        const siblings = await req.payload.find({
          collection: 'organization',
          where: {
            parentOrg: data.parentOrg,
          },
        })

        const sameName = siblings.docs.find((sibling) => sibling.name === data.name)
        if (sameName) {
          return new Response(
            JSON.stringify({ error: 'Organization with the same name already exists' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      }

      let parentPath = ''
      let parentDepth = 0

      if (data.parentOrg) {
        const parent = await req.payload.findByID({
          collection: 'organization',
          id: data.parentOrg,
        })

        if (!parent) throw new Error('Parent organization not found')

        if (parent.path?.includes(data.id)) {
          throw new Error('Invalid parent: would create a circular hierarchy')
        }

        parentPath = parent.path || ''
        parentDepth = parent.depth || 0
      }

      const createOrganization = await req.payload.create({
        collection: 'organization',
        data,
        req,
      })

      const currentId = createOrganization.id
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

      return new Response(JSON.stringify(createOrganization), {
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
