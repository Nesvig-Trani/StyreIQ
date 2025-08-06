'use server'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { WelcomeEmailCollectionSlug } from '../types'

export const getLastWelcomeEmail = async () => {
  const { payload } = await getPayloadContext()

  const welcomeEmail = await payload.find({
    collection: WelcomeEmailCollectionSlug,
    sort: '-createdAt',
    limit: 1,
  })

  return welcomeEmail.docs[0]
}
