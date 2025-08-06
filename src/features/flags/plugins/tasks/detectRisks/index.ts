import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { FlagsCollectionSlug } from '../../types'
import { FlagSourceEnum, FlagStatusEnum, FlagTypeEnum } from '@/features/flags/schemas'
import { UserRolesEnum } from '@/features/users'

export async function FindRisksAndCreateFlag() {
  const { payload } = await getPayloadContext()

  const CHECK_TO_FLAG_MAP: Record<string, FlagTypeEnum> = {
    isEnabledTwoFactor: FlagTypeEnum.MISSING_2FA,
    isInUseSecurePassword: FlagTypeEnum.SECURITY_RISK,
    admin_policy_agreement: FlagTypeEnum.UNACKNOWLEDGED_POLICIES,
    isCompletedTrainingAccessibility: FlagTypeEnum.INCOMPLETE_TRAINING,
    isCompletedTrainingRisk: FlagTypeEnum.INCOMPLETE_TRAINING,
    isCompletedTrainingBrand: FlagTypeEnum.INCOMPLETE_TRAINING,
    hasKnowledgeStandards: FlagTypeEnum.INCOMPLETE_TRAINING,
  }

  const fieldsToCheck = Object.keys(CHECK_TO_FLAG_MAP)

  const orCondition = fieldsToCheck.map((key) => {
    return { [key]: { not_equals: true } }
  })

  const result = await payload.find({
    collection: 'users',
    where: {
      or: [...orCondition],
      role: { not_equals: UserRolesEnum.SuperAdmin },
    },
  })

  const userIds = result.docs.map((u) => u.id)

  const existingFlags = await payload.find({
    collection: FlagsCollectionSlug,
    where: {
      and: [
        { 'affectedEntity.relationTo': { equals: 'users' } },
        { 'affectedEntity.value': { in: userIds } },
        { status: { not_equals: FlagStatusEnum.RESOLVED } },
      ],
    },
    limit: 0,
  })

  const existingFlagKeys = new Set(
    existingFlags.docs.map((flag) => {
      const userId =
        typeof flag.affectedEntity?.value === 'object'
          ? flag.affectedEntity.value.id
          : flag.affectedEntity?.value
      return `${userId}|${flag.flagType}`
    }),
  )
  const candidateFlags = result.docs.flatMap((user) =>
    fieldsToCheck
      .map((field) => {
        const flagType = CHECK_TO_FLAG_MAP[field]
        const isOk = (user as unknown as Record<string, boolean | undefined>)[field]
        const key = `${user.id}|${flagType}`

        if (!isOk && !existingFlagKeys.has(key)) {
          return {
            user,
            field,
            flagType,
          }
        }
        return null
      })
      .filter((flag) => flag !== null),
  )

  const seenKeys = new Set<string>()
  const uniqueCandidateFlags = candidateFlags.filter(({ user, flagType }) => {
    const key = `${String(user.id)}|${flagType}`
    if (seenKeys.has(key)) return false
    seenKeys.add(key)
    return true
  })
  await Promise.all(
    uniqueCandidateFlags.map(({ user, field, flagType }) =>
      payload.create({
        collection: FlagsCollectionSlug,
        data: {
          affectedEntity: { relationTo: 'users', value: user.id },
          source: FlagSourceEnum.AUTOMATED_SYSTEM,
          detectionDate: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          flagType,
          organizations: user.organizations,
          status: FlagStatusEnum.PENDING,
          description: `Automated check detected issue: ${flagType} (${field})`,
          suggestedAction: `Please resolve the issue: ${flagType.replace(/_/g, ' ')}`,
        },
      }),
    ),
  )
}
