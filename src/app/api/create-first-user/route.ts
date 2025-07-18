import { NextResponse } from 'next/server'
import { z } from 'zod'

import config from '@payload-config'
import { getPayload } from 'payload'

import { createFirstUserFormSchema, getTotalUsers, UserRolesEnum, UserStatusEnum } from '@/users'
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
        role: UserRolesEnum.SuperAdmin,
        status: UserStatusEnum.Active,
        organizations: null,
        admin_policy_agreement: false,
      },
      req,
    })

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
