'use server'
import { PaginatedDocs } from 'payload'
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
