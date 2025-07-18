import payload from 'payload'

export async function flagInactiveAccounts() {
  // Fetch all social media accounts
  const result = await payload.find({
    collection: 'social-medias',
    where: {
      status: { in: ['active', 'in_transition'] },
    },
  })

  for (const account of result.docs) {
    const status = account.status
    const isActiveOrTransition = status === 'active' || status === 'in_transition'
    const daysSinceActivity =
      (Date.now() - new Date(account.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    const shouldFlagInactive = isActiveOrTransition && daysSinceActivity > 30

    if (!shouldFlagInactive) {
      console.log(`Skipping account ${account.id} - not eligible for flagging`)
      continue
    }

    await payload.update({
      collection: 'social-medias',
      id: account.id,
      data: {
        inactiveFlag: shouldFlagInactive,
      },
    })
  }

  console.log('Inactive account flagging complete.')
}
