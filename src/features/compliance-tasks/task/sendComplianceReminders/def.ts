import { TaskConfig } from 'payload'
import { sendComplianceReminders } from '.'

export const sendComplianceRemindersTask = {
  slug: 'sendComplianceReminders',
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
    await sendComplianceReminders()
    return {
      output: {
        success: true,
        message: 'Compliance reminders sent successfully',
      },
    }
  },
} as TaskConfig
