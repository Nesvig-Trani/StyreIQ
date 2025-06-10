'use server'
import { User } from '@/payload-types'
import { getPayload } from 'payload'
import config from '@payload-config'

export const getAllOrganizations = async ({
  user,
}: {
  user: (User & { collection: 'users' }) | null
}) => {
  try {
    const payload = await getPayload({ config })

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


