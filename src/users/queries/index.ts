'use server'
import { PaginatedDocs } from 'payload'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { User } from '@/payload-types'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'

export const getUsersByOrganizations = async ({
  orgIds,
}: {
  orgIds: number[]
}): Promise<PaginatedDocs<User>> => {
  try {
    const { payload } = await getPayloadContext()
    const { user } = await getAuthUser()

    const users = await payload.find({
      collection: 'users',
      where: {
        'organizations.id': { in: orgIds },
      },
      overrideAccess: false,
      user,
    })
    return users
  } catch {
    return {
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
      totalDocs: 0,
      totalPages: 0,
      limit: 0,
      pagingCounter: 0,
    }
  }
}

export const getUserById = async ({ id }: { id: number }) => {
  const {payload} = await getPayloadContext()
  const user = await payload.findByID({
    collection: 'users',
    id: id,
    depth:0
  })
  return user
}
