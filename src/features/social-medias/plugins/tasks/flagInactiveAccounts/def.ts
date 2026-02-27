import { TaskConfig } from 'payload'
import { flagInactiveAccounts } from './flagInactiveAccounts'

export const flagInactiveAccountsTask = {
  slug: 'flagInactiveAccounts',
  retries: 2,
  schedule: [{ cron: '20 21 * * *' }],
  outputSchema: [
    {
      name: 'success',
      type: 'checkbox',
      required: true,
    },
    {
      name: 'message',
      type: 'text',
      required: true,
    },
  ],
  handler: async () => {
    await flagInactiveAccounts()
    return {
      output: {
        success: true,
        message: 'Inactive accounts flagged successfully',
      },
    }
  },
} as TaskConfig
