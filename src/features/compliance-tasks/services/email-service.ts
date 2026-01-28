import { Payload } from 'payload'
import { ComplianceTask, User } from '@/types/payload-types'

export class ComplianceEmailService {
  constructor(private payload: Payload) {}

  async sendMultipleTrainingsEmail(tasks: ComplianceTask[], user: User): Promise<void> {
    const taskUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/compliance`
    const dueDate = new Date(tasks[0].dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const trainingsListHtml = tasks
      .map(
        (task) => `
        <li style="margin: 15px 0; padding: 10px; background: #f9fafb; border-radius: 4px;">
          <strong style="color: #374151;">${task.description}</strong>
        </li>
      `,
      )
      .join('')

    await this.payload.sendEmail({
      to: user.email,
      subject: `Action Required: Complete ${tasks.length} Required Training${tasks.length > 1 ? 's' : ''}`,
      html: `
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">Training${tasks.length > 1 ? 's' : ''} Required</h2>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hi ${user.name},</p>
              <p>You have been assigned ${tasks.length} required training${tasks.length > 1 ? 's' : ''} in StyreIQ:</p>
              
              <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #2563eb;">Required Training${tasks.length > 1 ? 's' : ''}:</h3>
                <ul style="list-style: none; padding: 0;">
                  ${trainingsListHtml}
                </ul>
                <p style="margin-top: 20px;"><strong>Due Date:</strong> ${dueDate}</p>
              </div>

              <a href="${taskUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View My Tasks</a>

              <p>Please complete ${tasks.length > 1 ? 'these trainings' : 'this training'} by the due date to maintain compliance.</p>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                <p>This is an automated notification from StyreIQ.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    })
  }

  async sendTaskCreatedEmail(task: ComplianceTask, user: User): Promise<void> {
    const isPolicyTask = task.type === 'POLICY_ACKNOWLEDGMENT'
    const taskUrl = isPolicyTask
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/compliance/${this.getTaskRoute(task.type)}/${task.id}`
    const dueDate = new Date(task.dueDate).toLocaleDateString('en-US')

    await this.payload.sendEmail({
      to: user.email,
      subject: `New Action Required: ${this.getTaskTitle(task.type)}`,
      html: `
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">Action Required</h2>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hi ${user.name},</p>
              <p>A new action has been assigned to you in StyreIQ:</p>
              
              <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #2563eb;">${this.getTaskTitle(task.type)}</h3>
                <p><strong>Due Date:</strong> ${dueDate}</p>
              </div>

              ${
                isPolicyTask
                  ? `
                <p>When you log in to your dashboard, a modal will appear prompting you to review and acknowledge the policy.</p>
                <a href="${taskUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Go to Dashboard</a>
              `
                  : `
                <a href="${taskUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Take Action</a>
              `
              }

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                <p>This is an automated notification from StyreIQ.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    })
  }

  async sendFlagCreatorNotification(
    task: ComplianceTask,
    creator: User,
    assignedUser: User,
  ): Promise<void> {
    const dueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const taskUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/compliance`

    await this.payload.sendEmail({
      to: creator.email,
      subject: `Risk Flag Assigned: ${this.getTaskTypeLabel(task.type)}`,
      html: `
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1f2937;">Risk Flag Assignment Confirmation</h2>
              <p>Hello ${creator.name || creator.email},</p>
              <p>The risk flag you created has been assigned for review:</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151;">${this.getTaskTypeLabel(task.type)}</h3>
                <p style="color: #6b7280; margin: 10px 0;">${task.description}</p>
                <p style="margin: 10px 0;"><strong>Assigned To:</strong> ${assignedUser.name || assignedUser.email}</p>
                <p style="color: #ef4444; font-weight: bold; margin: 10px 0;">Due Date: ${dueDate}</p>
              </div>

              <p>You will be notified when this flag is resolved. If you need to coordinate, please contact ${assignedUser.name || assignedUser.email} directly.</p>
              
              <a href="${taskUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Flag Status</a>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This is an automated notification from StyreIQ.</p>
            </div>
          </body>
        </html>
      `,
    })
  }

  async sendReminderEmail(task: ComplianceTask, user: User, daysOverdue?: number): Promise<void> {
    const dueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const taskUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/compliance`

    const isOverdue = daysOverdue !== undefined && daysOverdue > 0
    const subject = isOverdue
      ? `OVERDUE: Compliance Task - ${this.getTaskTypeLabel(task.type)}`
      : `Reminder: Compliance Task Due Soon - ${this.getTaskTypeLabel(task.type)}`

    await this.payload.sendEmail({
      to: user.email,
      subject,
      html: `
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: ${isOverdue ? '#dc2626' : '#1f2937'};">${isOverdue ? '⚠️ OVERDUE' : 'Reminder'}: Compliance Task</h2>
              <p>Hello ${user.name || user.email},</p>
              <p>${isOverdue ? 'Your compliance task is overdue:' : 'This is a reminder about your pending compliance task:'}</p>
              
              <div style="background-color: ${isOverdue ? '#fef2f2' : '#f3f4f6'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${isOverdue ? '#dc2626' : '#3b82f6'};">
                <h3 style="margin-top: 0; color: #374151;">${this.getTaskTypeLabel(task.type)}</h3>
                <p style="color: #6b7280; margin: 10px 0;">${task.description}</p>
                <p style="color: ${isOverdue ? '#dc2626' : '#6b7280'}; font-weight: bold; margin: 10px 0;">
                  ${isOverdue ? `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}` : `Due Date: ${dueDate}`}
                </p>
              </div>

              <p>${isOverdue ? 'Please complete this task immediately to avoid further escalations.' : 'Please complete this task by the due date to maintain compliance.'}</p>
              
              <a href="${taskUrl}" style="display: inline-block; background-color: ${isOverdue ? '#dc2626' : '#3b82f6'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Complete Task Now</a>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This is an automated reminder from StyreIQ. Please do not reply to this email.</p>
            </div>
          </body>
        </html>
      `,
    })
  }

  async sendTaskReminderEmail(
    task: ComplianceTask,
    user: User,
    daysRemaining: number,
  ): Promise<void> {
    const taskUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/compliance/${this.getTaskRoute(task.type)}/${task.id}`
    const dueDate = new Date(task.dueDate).toLocaleDateString('en-US')

    await this.payload.sendEmail({
      to: user.email,
      subject: `Reminder: ${this.getTaskTitle(task.type)} - Due in ${daysRemaining} days`,
      html: `
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">⚠️ Reminder: Action Required</h2>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                <p>Hi ${user.name},</p>
                
                <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                  <strong>This is a reminder</strong> that you have an incomplete action in StyreIQ.
                </div>

                <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #f59e0b;">${this.getTaskTitle(task.type)}</h3>
                  <p><strong>Due Date:</strong> ${dueDate}</p>
                  <p><strong>Days Remaining:</strong> ${daysRemaining}</p>
                </div>

                <a href="${taskUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Complete Action</a>

                <p>Please complete this action as soon as possible to stay compliant.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                  <p>This is an automated reminder from StyreIQ. Please do not reply to this email.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })
  }

  async sendTaskEscalationEmail(task: ComplianceTask, user: User, supervisor: User): Promise<void> {
    const taskUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/compliance/${this.getTaskRoute(task.type)}/${task.id}`
    const dueDate = new Date(task.dueDate).toLocaleDateString('en-US')

    await this.payload.sendEmail({
      to: supervisor.email,
      subject: `[ESCALATION] Overdue Action: ${user.name} - ${this.getTaskTitle(task.type)}`,
      html: `
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">🚨 ESCALATION: Overdue Action</h2>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                <p>Hi ${supervisor.name},</p>
                
                <div style="background: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
                  <strong>ESCALATION NOTICE:</strong> The following action is overdue and requires your attention.
                </div>

                <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #dc2626;">${this.getTaskTitle(task.type)}</h3>
                  <p><strong>Assigned To:</strong> ${user.name} (${user.email})</p>
                  <p><strong>Due Date:</strong> ${dueDate}</p>
                  <p><strong>Status:</strong> OVERDUE</p>
                </div>

                <a href="${taskUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Review Action</a>

                <p>Please follow up with ${user.name} to ensure this action is completed promptly.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                  <p>This is an automated escalation from StyreIQ. Please do not reply to this email.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })
  }

  private getTaskTypeLabel(taskType: string): string {
    const labels: Record<string, string> = {
      PASSWORD_SETUP: 'Set Up Password & 2FA',
      CONFIRM_USER_PASSWORD: 'Confirm Personal Password Update',
      CONFIRM_SHARED_PASSWORD: 'Confirm Shared Account Password Update',
      CONFIRM_2FA: 'Confirm Two-Factor Authentication (2FA)',
      POLICY_ACKNOWLEDGMENT: 'Acknowledge Policy',
      TRAINING_COMPLETION: 'Complete Required Training',
      USER_ROLL_CALL: 'Confirm Your Role and Assigned Accounts',
      REVIEW_FLAG: 'Review Risk Flag',
    }

    return labels[taskType] || taskType
  }

  private getTaskTitle(type: string): string {
    const titles: Record<string, string> = {
      CONFIRM_USER_PASSWORD: 'Confirm User Password Update',
      CONFIRM_SHARED_PASSWORD: 'Confirm Shared Account Password Update',
      CONFIRM_2FA: 'Confirm Two-Factor Authentication (2FA)',
      POLICY_ACKNOWLEDGMENT: 'Acknowledge Policy',
      TRAINING_COMPLETION: 'Complete Required Training',
      USER_ROLL_CALL: 'Confirm Account Access (Roll Call)',
    }
    return titles[type] || 'Complete Action'
  }

  private getTaskRoute(type: string): string {
    const routes: Record<string, string> = {
      CONFIRM_USER_PASSWORD: 'user-password',
      CONFIRM_SHARED_PASSWORD: 'shared-password',
      CONFIRM_2FA: '2fa',
      POLICY_ACKNOWLEDGMENT: 'policy',
      TRAINING_COMPLETION: 'training',
      USER_ROLL_CALL: 'roll-call',
    }
    return routes[type] || 'task'
  }
}
