'use server'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'

export const getUnitAccessByUserId = async ({ id }: { id: number }) => {
  const { payload } = await getPayloadContext()
  const orgAccessResult = await payload.find({
    collection: 'organization_access',
    where: {
      and: [{ 'user.id': { equals: id } }, { 'organization.disabled': { not_equals: true } }],
    },
  })

  return orgAccessResult
}
