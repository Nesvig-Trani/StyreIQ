import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'

export const ensureStyreIQOrganization = async () => {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if StyreIQ organization already exists
  const existingStyreIQ = await payload.find({
    collection: 'organization',
    where: {
      name: { equals: 'StyreIQ' },
    },
    limit: 1,
  })

  if (existingStyreIQ.docs.length > 0) {
    return existingStyreIQ.docs[0]
  }

  if (existingStyreIQ.docs.length === 0) {
    throw new Error('StyreIQ organization not found')
  }
}
