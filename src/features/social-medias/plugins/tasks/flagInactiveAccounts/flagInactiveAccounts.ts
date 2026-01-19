import { FlagSourceEnum, FlagStatusEnum, FlagTypeEnum } from '@/features/flags/schemas'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'

export async function flagInactiveAccounts() {
  const { payload } = await getPayloadContext()

  const tenants = await payload.find({
    collection: 'tenants',
    where: { status: { equals: 'active' } },
    limit: 0,
  })

  const tenantIds = tenants.docs.map((t) => t.id)

  const result = await payload.find({
    collection: 'social-medias',
    where: {
      and: [{ tenant: { in: tenantIds } }, { status: { in: ['active', 'in_transition'] } }],
    },
  })

  const accountsToProcess = result.docs.filter((account) => {
    const status = account.status
    const isActiveOrTransition = status === 'active' || status === 'in_transition'
    const daysSinceActivity =
      (Date.now() - new Date(account.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    return isActiveOrTransition && daysSinceActivity > 30
  })

  const results = await Promise.allSettled(
    accountsToProcess.map(async (account) => {
      await payload.update({
        collection: 'social-medias',
        id: account.id,
        data: {
          inactiveFlag: true,
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
          lastActivity: account.updatedAt,
          source: FlagSourceEnum.AUTOMATED_SYSTEM,
          description: `Account has been inactive for 30+ days`,
          suggestedAction: 'Review account activity and consider archiving if no longer in use',
          tenant: account.tenant,
        },
      })
    }),
  )

  const errors = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[]

  if (errors.length > 0) {
    console.error('Errors encountered when flagging inactive accounts:')
    for (const err of errors) {
      console.error(err.reason)
    }
  }
}
