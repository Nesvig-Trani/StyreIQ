'use server'
import { Where } from 'payload'

import { getAuthUser } from '@/auth/utils/getAuthUser'
import { UserRolesEnum } from '@/users/schemas'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { SocialMediasCollectionSlug } from '../collections'

export const getAllSocialMediaAccounts = async () => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()
  const socialMedias = await payload.find({
    collection: SocialMediasCollectionSlug,
    limit: 0,
    user,
    overrideAccess: false,
  })

  return socialMedias
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

  const where: Where = {
    ...(status?.length && { status: { in: status } }),
    ...(platform?.length && {
      // Let DB handle case-insensitive comparison if your adapter supports it.
      platform: { in: platform },
    }),
    ...(organization?.length && {
      'organization.id': { in: organization.map(Number) },
    }),
    ...(primaryAdmin?.length && {
      'primaryAdmin.id': { in: primaryAdmin.map(Number) },
    }),
 }

  const socialMedias = await payload.find({
    collection: SocialMediasCollectionSlug,
    where,
    limit: pageSize,
    page: pageIndex + 1,
    user,
    overrideAccess: false,
  })

  return socialMedias
}

export const getSocialMediaById = async ({ id }: { id: number }) => {
  const { payload } = await getPayloadContext()
  const socialMedia = await payload.findByID({
    collection: SocialMediasCollectionSlug,
    id: id,
  })
  return socialMedia
}
