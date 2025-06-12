'use server'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { User } from '@/payload-types'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { Where } from 'payload'

export const getAllOrganizations = async ({
  user,
}: {
  user: (User & { collection: 'users' }) | null
}) => {
  try {
    const { payload } = await getPayloadContext()
    const organizations = await payload.find({
      collection: 'organization',
      depth: 0,
      select: {
        id: true,
        name: true,
        parentOrg: true,
        depth: true,
        path: true,
      },
      limit: 0,
      overrideAccess: false,
      user,
    })
    return organizations
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

export const getOrganizationsWithFilter = async ({
  status,
  type,
}: {
  status?: string
  type?: string
}) => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()
  const where: Where = {
    ...(status && { status: { equals: status } }),
    ...(type && { type: { equals: type } }),
  }
  return payload.find({
    collection: 'organization',
    depth: 1,
    overrideAccess: false,
    user,
    limit: 0,
    sort: ['createdAt'],
    where,
  })
}
