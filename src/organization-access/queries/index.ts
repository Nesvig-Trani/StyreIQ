'use server'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'

export const getOrganizationAccessByUserId = async ({ id }: { id: number }) => {
  const { payload } = await getPayloadContext()
   const orgAccessResult = await payload.find({
    collection: 'organization_access',
    where: {
      'user.id': { equals: id },
    },
  })

  return orgAccessResult
}
