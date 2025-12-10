import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { FlagsCollectionSlug } from '../../types'
import { FlagSourceEnum, FlagStatusEnum, FlagTypeEnum } from '@/features/flags/schemas'
import { UserRolesEnum } from '@/features/users'
import { Payload } from 'payload'
import { Flag, User } from '@/types/payload-types'

const CHECK_TO_FLAG_MAP: Record<string, FlagTypeEnum> = {
  isEnabledTwoFactor: FlagTypeEnum.MISSING_2FA,
  isInUseSecurePassword: FlagTypeEnum.SECURITY_RISK,
  admin_policy_agreement: FlagTypeEnum.UNACKNOWLEDGED_POLICIES,
  isCompletedTrainingAccessibility: FlagTypeEnum.INCOMPLETE_TRAINING,
  isCompletedTrainingRisk: FlagTypeEnum.INCOMPLETE_TRAINING,
  // TODO: disable some user questions
  // isCompletedTrainingBrand: FlagTypeEnum.INCOMPLETE_TRAINING,
  // hasKnowledgeStandards: FlagTypeEnum.INCOMPLETE_TRAINING,
  // offboardingCompleted: FlagTypeEnum.INCOMPLETE_OFFBOARDING,
}

async function findUsersWithIssues(payload: Payload, tenantId: number, fieldsToCheck: string[]) {
  const orCondition = fieldsToCheck.map((key) => ({ [key]: { not_equals: true } }))

  return await payload.find({
    collection: 'users',
    where: {
      and: [
        { tenant: { equals: tenantId } },
        { or: [...orCondition] },
        { role: { not_equals: UserRolesEnum.SuperAdmin } },
      ],
    },
  })
}

async function findExistingFlags(payload: Payload, tenantId: number, userIds: (string | number)[]) {
  return await payload.find({
    collection: FlagsCollectionSlug,
    where: {
      and: [
        { tenant: { equals: tenantId } },
        { 'affectedEntity.relationTo': { equals: 'users' } },
        { 'affectedEntity.value': { in: userIds } },
        { status: { not_equals: FlagStatusEnum.RESOLVED } },
      ],
    },
    limit: 0,
  })
}

function buildExistingFlagKeys(flags: Flag[]) {
  return new Set(
    flags.map((flag) => {
      const userId =
        typeof flag.affectedEntity?.value === 'object'
          ? flag.affectedEntity.value.id
          : flag.affectedEntity?.value
      return `${userId}|${flag.flagType}`
    }),
  )
}

function identifyCandidateFlags(
  users: User[],
  fieldsToCheck: string[],
  existingFlagKeys: Set<string>,
) {
  return users.flatMap((user) =>
    fieldsToCheck
      .map((field) => {
        const flagType = CHECK_TO_FLAG_MAP[field]
        const isOk = (user as unknown as Record<string, boolean | undefined>)[field]
        const key = `${user.id}|${flagType}`

        if (!isOk && !existingFlagKeys.has(key)) {
          return { user, field, flagType }
        }
        return null
      })
      .filter((flag) => flag !== null),
  )
}

function deduplicateFlags(candidateFlags: { user: User; field: string; flagType: string }[]) {
  const seenKeys = new Set<string>()
  return candidateFlags.filter(({ user, flagType }) => {
    const key = `${String(user.id)}|${flagType}`
    if (seenKeys.has(key)) return false
    seenKeys.add(key)
    return true
  })
}

async function createFlagsForTenant(
  payload: Payload,
  flags: { user: User; field: string; flagType: string }[],
  tenantId: number,
) {
  const results = await Promise.allSettled(
    flags.map(async ({ user, field, flagType }) => {
      return await payload.create({
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
          tenant: tenantId,
        },
      })
    }),
  )

  const failed = results.filter((r) => r.status === 'rejected')
  if (failed.length > 0) {
    console.warn(
      `[detectRisks] ${failed.length}/${flags.length} flags failed to create for tenant ${tenantId}`,
    )
  }
}

async function processTenant(
  payload: Payload,
  tenant: { id: number; name: string },
  fieldsToCheck: string[],
) {
  try {
    const result = await findUsersWithIssues(payload, tenant.id, fieldsToCheck)
    const userIds = result.docs.map((u) => u.id)

    const existingFlags = await findExistingFlags(payload, tenant.id, userIds)
    const existingFlagKeys = buildExistingFlagKeys(existingFlags.docs)

    const candidateFlags = identifyCandidateFlags(result.docs, fieldsToCheck, existingFlagKeys)
    const uniqueCandidateFlags = deduplicateFlags(candidateFlags)

    await createFlagsForTenant(payload, uniqueCandidateFlags, tenant.id)

    return { success: true, flagsCreated: uniqueCandidateFlags.length }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      flagsCreated: 0,
    }
  }
}

export async function findRisksAndCreateFlag() {
  try {
    const { payload } = await getPayloadContext()

    const tenants = await payload.find({
      collection: 'tenants',
      where: { status: { equals: 'active' } },
      limit: 0,
    })

    if (tenants.docs.length === 0) {
      return { success: true, message: 'No active tenants to process' }
    }

    const fieldsToCheck = Object.keys(CHECK_TO_FLAG_MAP)

    const results = await Promise.allSettled(
      tenants.docs.map((tenant) => processTenant(payload, tenant, fieldsToCheck)),
    )

    const summary = {
      total: results.length,
      succeeded: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
      totalFlagsCreated: results
        .filter((r) => r.status === 'fulfilled')
        .reduce((sum, r) => sum + (r.value?.flagsCreated || 0), 0),
    }

    if (summary.failed > 0) {
      console.warn(`[detectRisks] ${summary.failed} tenants failed to process`)
    }

    return {
      success: summary.failed === 0,
      summary,
    }
  } catch (error) {
    console.error('[detectRisks] Fatal error in risk detection job:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      summary: {
        total: 0,
        succeeded: 0,
        failed: 0,
        totalFlagsCreated: 0,
      },
    }
  }
}
