import { TaskConfig } from 'payload'
import { flagInactiveAccounts } from './flagInactiveAccounts'

export const flagInactiveAccountsTask = {
  slug: 'flagInactiveAccounts',
  retries: 2,
  inputSchema: [
    {
      name: 'dryRun',
      type: 'checkbox',
      required: false,
      defaultValue: false,
      label: 'Dry Run (do not update accounts)',
    },
  ],
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
