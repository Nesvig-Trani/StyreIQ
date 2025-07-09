import { FlagSourceEnum, FlagStatusEnum, FlagTypeEnum } from '@/flags/schemas'
import { FlagsCollectionSlug } from '@/plugins/flags/types'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { SocialMediasCollectionSlug } from '@/social-medias'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { payload } = await getPayloadContext()
  const result = await payload.find({
    collection: SocialMediasCollectionSlug,
    where: {
      or: [
        { isEnabledTwoFactor: { not_equals: true } },
        { isInUseSecurePassword: { not_equals: true } },
        { isAcceptedPolicies: { not_equals: true } },
        { isCompletedTrainingAccessibility: { not_equals: true } },
        { isCompletedTrainingRisk: { not_equals: true } },
        { isCompletedTrainingBrand: { not_equals: true } },
        { hasKnowledgeStandards: { not_equals: true } },
      ],
    },
  })
  const accountIds = result.docs.map((account) => account.id)
  const alreadyDetected = await payload.find({
    collection: FlagsCollectionSlug,
    where: {
      and: [
        {
          'affectedEntity.relationTo': { equals: 'social-medias' },
        },
        {
          'affectedEntity.value': { in: accountIds },
        },
        { status: { not_equals: FlagStatusEnum.RESOLVED } },
      ],
    },
  })

  const alreadyDetectedIds = alreadyDetected.docs
    .map((flag) =>
      typeof flag.affectedEntity?.value === 'object' ? flag.affectedEntity?.value.id : null,
    )
    .filter(Boolean)

  const newFlags = result.docs.filter((account) => !alreadyDetectedIds.includes(account.id))
  await Promise.all(
    newFlags.map((account) => {
      return payload.create({
        collection: FlagsCollectionSlug,
        data: {
          affectedEntity: { relationTo: 'social-medias', value: account.id },
          source: FlagSourceEnum.AUTOMATED_SYSTEM,
          detectionDate: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          flagType: FlagTypeEnum.SECURITY_RISK,
          organization: account.organization,
          status: FlagStatusEnum.PENDING,
          description:
            'Automated check detected missing security or compliance settings in this social media account',
          suggestedAction:
            'Review the account settings and complete all required security and compliance steps (e.g., enable two-factor authentication, set a secure password, complete required trainings).',
        },
      })
    }),
  )
  return NextResponse.json({ success: true })
}
