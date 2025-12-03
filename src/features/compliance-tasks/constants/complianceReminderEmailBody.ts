type ComplianceReminderEmailProps = {
  userName: string
  taskType: string
  taskDescription: string
  dueDate: string
  daysSinceDue: number
  isEscalation?: boolean
  escalatedFromUser?: string
}

export const complianceReminderEmailBody = ({
  userName,
  taskType,
  taskDescription,
  dueDate,
  daysSinceDue,
  isEscalation = false,
  escalatedFromUser,
}: ComplianceReminderEmailProps) => {
  const isOverdue = daysSinceDue > 0
  const statusColor = isOverdue ? '#e53e3e' : '#f6ad55'
  const statusText = isOverdue ? 'OVERDUE' : 'DUE SOON'

  if (isEscalation) {
    return `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #fafafa;">
        <div style="background-color: #e53e3e; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">TASK ESCALATION</h1>
        </div>

        <div style="padding: 20px;">
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            Hello ${userName},
          </p>

          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            A compliance task has been escalated to you for review:
          </p>

          <div style="background-color: #fff; border-left: 4px solid #e53e3e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
              <strong>User:</strong> ${escalatedFromUser || 'N/A'}
            </p>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
              <strong>Task Type:</strong> ${taskType}
            </p>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
              <strong>Description:</strong> ${taskDescription}
            </p>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
              <strong>Original Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}
            </p>
            <p style="margin: 0; font-size: 14px; color: #e53e3e;">
              <strong>Days Overdue:</strong> ${Math.abs(daysSinceDue)}
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            Please follow up with the assigned user to ensure completion of this task.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/compliance" 
               style="display: inline-block; padding: 12px 30px; background-color: #e53e3e; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View Dashboard
            </a>
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

        <p style="font-size: 12px; color: #bbb; text-align: center;">
          &copy; ${new Date().getFullYear()} StyreIQ. All rights reserved.
        </p>
      </div>
    `
  }

  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #fafafa;">
      <div style="background-color: ${statusColor}; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">${statusText}: Compliance Task Reminder</h1>
      </div>

      <div style="padding: 20px;">
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Hello ${userName},
        </p>

        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          ${isOverdue ? 'This is an important reminder that you have an <strong>overdue</strong> compliance task:' : 'This is a reminder about your pending compliance task:'}
        </p>

        <div style="background-color: #fff; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #222;">
            ${taskType}
          </p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
            ${taskDescription}
          </p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
            <strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}
          </p>
          ${
            isOverdue
              ? `<p style="margin: 0; font-size: 14px; color: #e53e3e; font-weight: bold;">
                   Days Overdue: ${Math.abs(daysSinceDue)}
                 </p>`
              : ''
          }
        </div>

        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Please complete this task as soon as possible to maintain compliance.
          ${isOverdue ? '<strong>Failure to complete this task may result in escalation to your supervisor.</strong>' : ''}
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/compliance" 
             style="display: inline-block; padding: 12px 30px; background-color: #3182ce; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Complete Task Now
          </a>
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

      <p style="font-size: 12px; color: #bbb; text-align: center;">
        &copy; ${new Date().getFullYear()} StyreIQ. All rights reserved.
      </p>
    </div>
  `
}
