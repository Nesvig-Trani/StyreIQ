'use server'
import { Where } from 'payload'

import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { SocialMediasCollectionSlug } from '../collections'
import { normalizeUserTenant } from '@/features/tenants/plugins/collections/helpers/access-control-helpers'

export const getAllSocialMediaAccounts = async () => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
    return {
      docs: [],
      totalDocs: 0,
      hasNextPage: false,
      hasPrevPage: false,
      totalPages: 0,
      limit: 0,
      page: 1,
      pagingCounter: 0,
      prevPage: null,
      nextPage: null,
    }
  }

  const userWithTenantId = normalizeUserTenant(user)

  const socialMedias = await payload.find({
    collection: SocialMediasCollectionSlug,
    limit: 0,
    user: userWithTenantId,
    overrideAccess: false,
  })

  return socialMedias
}

export const getSocialMediaAccountsCount = async (): Promise<number> => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
    return 0
  }

  const userWithTenantId = normalizeUserTenant(user)

  const where: Where = {}

  if (user.role === 'unit_admin') {
    const organizationIds = (user.organizations ?? []).map((org) =>
      typeof org === 'object' && org !== null && 'id' in org ? org.id : (org as number),
    )

    if (organizationIds.length > 0) {
      where['organization.id'] = { in: organizationIds }
    } else {
      where['organization.id'] = { in: [-1] }
    }
  } else if (user.role === 'social_media_manager') {
    where['socialMediaManagers'] = { in: [user.id] }
  }

  const socialMediaAccounts = await payload.find({
    collection: SocialMediasCollectionSlug,
    where,
    limit: 0,
    user: userWithTenantId,
    overrideAccess: false,
  })

  return socialMediaAccounts.totalDocs
}

export const getSocialMediaAccounts = async ({
  pageSize,
  pageIndex,
  status,
  platform,
  organization,
  primaryAdmin,
}: {
  pageSize: number
  pageIndex: number
  status?: string[]
  platform?: string[]
  organization?: string[]
  primaryAdmin?: string[]
}) => {
  const { user } = await getAuthUser()
  const { payload } = await getPayloadContext()

  if (!user)
    return {
      docs: [],
      totalDocs: 0,
      hasNextPage: false,
      hasPrevPage: false,
      totalPages: 0,
      limit: 0,
      page: 1,
      pagingCounter: 0,
      prevPage: null,
      nextPage: null,
    }

  const userWithTenantId = normalizeUserTenant(user)

  const where: Where = {
    ...(status?.length && { status: { in: status } }),
    ...(platform?.length && {
      // Let DB handle case-insensitive comparison if your adapter supports it.
      platform: { in: platform },
    }),
    ...(primaryAdmin?.length && {
      'primaryAdmin.id': { in: primaryAdmin.map(Number) },
    }),
  }

  if (user?.role === 'unit_admin') {
    const organizationIds = (user.organizations ?? []).map((org) =>
      typeof org === 'object' && org !== null && 'id' in org ? org.id : (org as number),
    )
    if (organization?.length) {
      const filteredOrgIds = organization.map(Number).filter((id) => organizationIds.includes(id))
      where['organization.id'] = { in: filteredOrgIds.length > 0 ? filteredOrgIds : [-1] }
    } else {
      where['organization.id'] = { in: organizationIds.length > 0 ? organizationIds : [-1] }
    }
  } else if (user?.role === 'social_media_manager') {
    where['socialMediaManagers'] = { in: [user.id] }
  } else if (organization?.length) {
    where['organization.id'] = { in: organization.map(Number) }
  }

  return await payload.find({
    collection: SocialMediasCollectionSlug,
    where,
    limit: pageSize,
    page: pageIndex + 1,
    user: userWithTenantId,
    overrideAccess: false,
  })
}

export const getSocialMediaById = async ({ id }: { id: number }) => {
  const { payload } = await getPayloadContext()
  const socialMedia = await payload.findByID({
    collection: SocialMediasCollectionSlug,
    id: id,
  })
  return socialMedia
}
