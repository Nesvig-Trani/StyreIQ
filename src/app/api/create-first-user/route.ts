import { NextResponse } from 'next/server'
import { z } from 'zod'

import config from '@/lib/payload/payload.config'
import { getPayload } from 'payload'

import {
  createFirstUserFormSchema,
  getTotalUsers,
  UserRolesEnum,
  UserStatusEnum,
} from '@/features/users'
import { EndpointError } from '@/shared/errors'

/**
 * Endpoint to create a user for the first time.
 * POST /api/create-first-user
 * @param req
 * @returns
 */
export async function POST(req: Request) {
  try {
    const totalUsers = await getTotalUsers()

    if (totalUsers > 0) {
      throw new EndpointError('This action is not permitted.', 401)
    }

    const body = await req.json()

    const dataParsed = createFirstUserFormSchema.parse(body)

    const payload = await getPayload({ config })

    const createdUser = await payload.create({
      collection: 'users',
      data: {
        name: dataParsed.name,
        email: dataParsed.email,
        password: dataParsed.password,
        roles: [UserRolesEnum.SuperAdmin],
        active_role: UserRolesEnum.SuperAdmin,
        status: UserStatusEnum.Active,
        organizations: null,
        admin_policy_agreement: false,
      },
      req,
    })

    // Create StyreIQ organization after the first user is created
    const existingStyreIQ = await payload.find({
      collection: 'organization',
      where: {
        name: { equals: 'StyreIQ' },
      },
      limit: 1,
    })

    if (existingStyreIQ.docs.length === 0) {
      await payload.create({
        collection: 'organization',
        data: {
          name: 'StyreIQ',
          type: 'corporate_enterprise',
          admin: createdUser.id,
          status: 'active',
          description:
            'StyreIQ is the parent organization for all governance and compliance management',
          delegatedPermissions: true,
          path: createdUser.id.toString(),
          depth: 0,
        },
        req,
      })
    }

    return NextResponse.json(createdUser, { status: 201 })
  } catch (catchError) {
    if (catchError instanceof SyntaxError) {
      return NextResponse.json({ error: 'Missing JSON body' }, { status: 400 })
    }
    if (catchError instanceof z.ZodError) {
      return NextResponse.json({ error: catchError.message }, { status: 400 })
    }
    if (catchError instanceof EndpointError) {
      return NextResponse.json({ error: catchError.message }, { status: catchError.code })
    }
    return NextResponse.json({ error: 'Error creating the first user.' }, { status: 400 })
  }
}
