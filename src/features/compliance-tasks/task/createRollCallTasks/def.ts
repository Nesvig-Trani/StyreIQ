import { TaskConfig } from 'payload'
import { createRollCallTasks } from '.'

export const createRollCallTasksTask = {
  slug: 'createRollCallTasks',
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
    await createRollCallTasks()
    return {
      output: {
        success: true,
        message: 'Roll Call tasks created successfully',
      },
    }
  },
} as unknown as TaskConfig
