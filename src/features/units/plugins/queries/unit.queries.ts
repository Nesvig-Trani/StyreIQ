'use server'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { Where } from 'payload'

export const getAllUnits = async () => {
  try {
    const { payload } = await getPayloadContext()
    const { user } = await getAuthUser()
    const organizations = await payload.find({
      collection: 'organization',
      depth: 1,
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

export const getUnitsWithFilter = async ({ status, type }: { status?: string; type?: string }) => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
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

  // First, get the user's organizations
  const userOrgIds = await payload.db.drizzle.query.organization.findMany({
    where: (orgs, { inArray }) =>
      inArray(
        orgs.id,
        user.organizations!.map((org) =>
          typeof org === 'object' && org !== null && 'id' in org ? org.id : org,
        ),
      ),
  })

  // Get all organizations that are either user's orgs or their children
  const organizations = await payload.db.drizzle.query.organization.findMany({
    where: (orgs, { inArray }) => {
      return inArray(
        orgs.id,
        userOrgIds.map((org) => org.id),
      )
    },
  })

  // Create a where clause that includes all user's orgs and their children
  const where: Where = {
    and: [
      {
        id: {
          in: organizations.map((org) => org.id),
        },
      },
      ...(status ? [{ status: { equals: status } }] : []),
      ...(type ? [{ type: { equals: type } }] : []),
    ],
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
