import { TaskConfig } from 'payload'
import { FindRisksAndCreateFlag } from '.'

export const detectRisksTask = {
  slug: 'detectRisks',
  retries: 2,
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
    await FindRisksAndCreateFlag()
    return {
      output: {
        success: true,
        message: 'Inactive accounts flagged successfully',
      },
    }
  },
} as TaskConfig<'detectRisks'>
