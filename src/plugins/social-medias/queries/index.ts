'use server'
import { Where } from 'payload'

import { getAuthUser } from '@/auth/utils/getAuthUser'
import { UserRolesEnum } from '@/users/schemas'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { SocialMediasCollectionSlug } from '../collections'

export const getSocialMediaAccounts = async ({
  pageSize,
  pageIndex,
}: {
  pageSize: number
  pageIndex: number
}) => {
  const { user } = await getAuthUser()
  const { payload } = await getPayloadContext()
  const where: Where =
    user && user.role !== UserRolesEnum.SuperAdmin && user.organizations
      ? {
          or: [
            {
              'organization.id': {
                in: user.organizations.map((organization) =>
                  typeof organization === 'number' ? organization : organization.id,
                ),
              },
            },
            {
              'primaryAdmin.id': { equals: user.id },
            },
            {
              'backupAdmin.id': { equals: user.id },
            },
          ],
        }
      : {}

  const socialMedias = await payload.find({
    collection: SocialMediasCollectionSlug,
    where,
    limit: pageSize,
    page: pageIndex + 1,
  })

  return socialMedias
}
