'use server'
import { Where } from 'payload'

import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { SocialMediasCollectionSlug } from '../collections'
import {
  createUserForQueriesFromCookie,
  getSelectedTenantIdFromCookie,
} from '@/app/(dashboard)/server-tenant-context'
import { UserRolesEnum } from '@/shared/constants/user-roles'

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

  const userForQueries = await createUserForQueriesFromCookie(user)
  const selectedTenantId = await getSelectedTenantIdFromCookie()

  const where: Where = {}

  if (user.role === UserRolesEnum.SuperAdmin && selectedTenantId !== null) {
    where.tenant = { equals: selectedTenantId }
  }

  const socialMedias = await payload.find({
    collection: SocialMediasCollectionSlug,
    where,
    limit: 0,
    user: userForQueries,
    overrideAccess: user.role === UserRolesEnum.SuperAdmin,
  })

  return socialMedias
}

export const getSocialMediaAccountsCount = async (): Promise<number> => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
    return 0
  }

  const userForQueries = await createUserForQueriesFromCookie(user)
  const selectedTenantId = await getSelectedTenantIdFromCookie()

  const where: Where = {}

  switch (user.role) {
    case UserRolesEnum.SuperAdmin: {
      if (selectedTenantId !== null) {
        where.tenant = { equals: selectedTenantId }
      }
      break
    }

    case 'unit_admin': {
      const organizationIds = (user.organizations ?? []).map((org) =>
        typeof org === 'object' && org !== null && 'id' in org ? org.id : (org as number),
      )

      where['organization.id'] = {
        in: organizationIds.length > 0 ? organizationIds : [-1],
      }
      break
    }

    case 'social_media_manager': {
      where['socialMediaManagers'] = { in: [user.id] }
      break
    }

    default:
      break
  }

  const socialMediaAccounts = await payload.find({
    collection: SocialMediasCollectionSlug,
    where,
    limit: 0,
    user: userForQueries,
    overrideAccess: user.role === UserRolesEnum.SuperAdmin,
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

  const userForQueries = await createUserForQueriesFromCookie(user)
  const selectedTenantId = await getSelectedTenantIdFromCookie()

  const where: Where = {
    ...(status?.length && { status: { in: status } }),
    ...(platform?.length && { platform: { in: platform } }),
    ...(primaryAdmin?.length && {
      'primaryAdmin.id': { in: primaryAdmin.map(Number) },
    }),
  }

  switch (user.role) {
    case UserRolesEnum.SuperAdmin: {
      if (selectedTenantId !== null) {
        where.tenant = { equals: selectedTenantId }
      }
      if (organization?.length) {
        where['organization.id'] = { in: organization.map(Number) }
      }
      break
    }

    case 'unit_admin': {
      const organizationIds = (user.organizations ?? []).map((org) =>
        typeof org === 'object' && org !== null && 'id' in org ? org.id : (org as number),
      )

      if (organization?.length) {
        const filteredOrgIds = organization.map(Number).filter((id) => organizationIds.includes(id))

        where['organization.id'] = {
          in: filteredOrgIds.length > 0 ? filteredOrgIds : [-1],
        }
      } else {
        where['organization.id'] = {
          in: organizationIds.length > 0 ? organizationIds : [-1],
        }
      }
      break
    }
    case 'social_media_manager': {
      where['socialMediaManagers'] = { in: [user.id] }
      break
    }
    default: {
      if (organization?.length) {
        where['organization.id'] = { in: organization.map(Number) }
      }
      break
    }
  }

  return await payload.find({
    collection: SocialMediasCollectionSlug,
    where,
    limit: pageSize,
    page: pageIndex + 1,
    user: userForQueries,
    overrideAccess: user.role === UserRolesEnum.SuperAdmin,
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
