import { TaskConfig } from 'payload'
import { findRisksAndCreateFlag } from '.'

export const detectRisksTask = {
  slug: 'detectRisks',
  retries: 2,
  schedule: [{ cron: '30 20 * * *' }],
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
    await findRisksAndCreateFlag()
    return {
      output: {
        success: true,
        message: 'Risk detection completed successfully',
      },
    }
  },
} as TaskConfig<'detectRisks'>
