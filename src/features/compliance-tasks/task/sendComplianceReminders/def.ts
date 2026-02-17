import { TaskConfig } from 'payload'
import { sendComplianceReminders } from '.'

export const sendComplianceRemindersTask = {
  slug: 'sendComplianceReminders',
  queue: 'daily',
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
    await sendComplianceReminders()
    return {
      output: {
        success: true,
        message: 'Compliance reminders sent successfully',
      },
    }
  },
} as TaskConfig
