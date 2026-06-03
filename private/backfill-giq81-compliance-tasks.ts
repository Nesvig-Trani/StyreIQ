/**
 * GIQ-81 Backfill — generate compliance tasks for users that have none.
 *
 * Run once with:  yarn tsx private/backfill-giq81-compliance-tasks.ts
 *
 * The ComplianceTaskGenerator is idempotent (each task type checks for an
 * existing pending/overdue row before creating), so this is safe to re-run.
 */
import { getPayload } from 'payload'
import config from '../src/lib/payload/payload.config'
import { ComplianceTaskGenerator } from '../src/features/compliance-tasks/services/compliance-task-generator'

async function main() {
  const payload = await getPayload({ config })

  // Find all users with a tenant assigned
  const allUsers = await payload.find({
    collection: 'users',
    where: { tenant: { not_equals: null } },
    limit: 0,
    depth: 1,
    overrideAccess: true,
  })

  let backfilled = 0
  let skipped = 0
  let failed = 0

  for (const user of allUsers.docs) {
    // Check if the user already has any compliance tasks
    const existing = await payload.find({
      collection: 'compliance_tasks',
      where: { assignedUser: { equals: user.id } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.totalDocs > 0) {
      skipped++
      continue
    }

    try {
      const generator = new ComplianceTaskGenerator(payload)
      await generator.generateTasksForNewUserExceptRollCall(user)
      console.log(`✓ Backfilled tasks for user ${user.id} (${user.email})`)
      backfilled++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`✗ Failed for user ${user.id} (${user.email}): ${message}`)
      failed++
    }
  }

  console.log(
    `\nDone — backfilled: ${backfilled}, skipped (already had tasks): ${skipped}, failed: ${failed}`,
  )
  process.exit(failed > 0 ? 1 : 0)
}

main()
