import { TaskConfig } from 'payload'
import { createRecurringPasswordTasks } from '.'

export const createRecurringPasswordTasksTask = {
  slug: 'createRecurringPasswordTasks',
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
    await createRecurringPasswordTasks()
    return {
      output: {
        success: true,
        message: 'Recurring password tasks created successfully',
      },
    }
  },
} as unknown as TaskConfig
