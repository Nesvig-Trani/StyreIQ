import { FlagSourceEnum, FlagStatusEnum, FlagTypeEnum } from '@/features/flags/schemas'
import payload from 'payload'

export async function flagInactiveAccounts() {
  const tenants = await payload.find({
    collection: 'tenants',
    where: { status: { equals: 'active' } },
    limit: 0,
  })

  for (const tenant of tenants.docs) {
    const result = await payload.find({
      collection: 'social-medias',
      where: {
        and: [{ tenant: { equals: tenant.id } }, { status: { in: ['active', 'in_transition'] } }],
      },
    })

    for (const account of result.docs) {
      const status = account.status
      const isActiveOrTransition = status === 'active' || status === 'in_transition'
      const daysSinceActivity =
        (Date.now() - new Date(account.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      const shouldFlagInactive = isActiveOrTransition && daysSinceActivity > 30

      if (!shouldFlagInactive) {
        continue
      }

      await payload.update({
        collection: 'social-medias',
        id: account.id,
        data: {
          inactiveFlag: shouldFlagInactive,
        },
      })

      await payload.create({
        collection: 'flags',
        data: {
          flagType: FlagTypeEnum.INACTIVE_ACCOUNT,
          affectedEntity: {
            relationTo: 'social-medias',
            value: account.id,
          },
          organizations: [account.organization],
          status: FlagStatusEnum.PENDING,
          detectionDate: new Date().toISOString(),
          source: FlagSourceEnum.AUTOMATED_SYSTEM,
          description: `Account has been inactive for 30+ days`,
          suggestedAction: 'Review account activity and consider archiving if no longer in use',
          tenant: tenant.id,
        },
      })
    }
  }
}
