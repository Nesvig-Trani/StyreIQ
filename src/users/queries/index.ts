'use server'
import { PaginatedDocs, Where } from 'payload'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { User } from '@/payload-types'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { UserStatusEnum } from '../schemas'

export const getUsersByOrganizations = async ({
  orgIds,
}: {
  orgIds: number[]
}): Promise<PaginatedDocs<User>> => {
  try {
    const { payload } = await getPayloadContext()
    const { user } = await getAuthUser()

    const where: Where =
      orgIds.length === 0
        ? {}
        : {
            'organizations.id': { in: orgIds },
          }

    const users = await payload.find({
      collection: 'users',
      where,
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
  const { payload } = await getPayloadContext()
  const user = await payload.findByID({
    collection: 'users',
    id: id,
    depth: 0,
  })
  return user
}

export const getPendingActivationUsers = async ({
  limit,
  page,
  user,
}: {
  limit: number
  page: number
  user: User | null
}) => {
  const { payload } = await getPayloadContext()
  const users = await payload.find({
    collection: 'users',
    where: {
      status: { equals: UserStatusEnum.PendingActivation },
    },
    depth: 1,
    limit,
    page,
    overrideAccess: false,
    user: user,
  })
  return users
}

export const getAllUsers = async () => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  const users = await payload.find({
    collection: 'users',
    limit: 0,
    depth: 0,
    overrideAccess: false,
    user,
  })
  return users
}

/**
 * Returns the total of users.
 * @returns
 */
export const getTotalUsers = async (): Promise<number> => {
  try {
    const { payload } = await getPayloadContext()

    const allUsers = await payload.find({
      collection: 'users',
    })
    return allUsers.totalDocs
  } catch {
    return 0
  }
}
