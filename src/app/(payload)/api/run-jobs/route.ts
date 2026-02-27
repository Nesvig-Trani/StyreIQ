import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const maxDuration = 60

const TASK_SLUGS = [
  'sendComplianceReminders',
  'createRecurringPasswordTasks',
  'createRollCallTasks',
  'flagInactiveAccounts',
  'detectRisks',
] as const

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })

  try {
    for (const task of TASK_SLUGS) {
      try {
        await payload.jobs.queue({ task, input: {} })
        payload.logger.info(`Queued: ${task}`)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        payload.logger.error(`Failed to queue ${task}: ${message}`)
      }
    }

    const result = await payload.jobs.run()
    payload.logger.info(`Jobs run complete: ${JSON.stringify(result)}`)

    return NextResponse.json({ success: true, result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    payload.logger.error(`Cron execution failed: ${message}`)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
