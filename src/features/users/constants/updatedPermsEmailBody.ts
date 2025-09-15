type updatedPermsProps = {
  name: string
  role?: string | null
  status?: string | null
  organizations?: { name: string }[]
  roleChanged: boolean
  statusChanged: boolean
  orgsChanged: boolean
}

export const updatedPermsEmailBody = ({
  name,
  role,
  status,
  organizations,
  roleChanged,
  statusChanged,
  orgsChanged,
}: updatedPermsProps) => {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #fafafa;">
      <h1 style="color: #222; font-size: 24px;">Hello ${name || 'User'},</h1>

      <p style="font-size: 16px; line-height: 1.5; color: #555;">
        We wanted to inform you that your account permissions have been updated. Here are the details:
      </p>

      <ul style="font-size: 16px; color: #555; line-height: 1.6; padding-left: 20px;">
        ${roleChanged ? `<li><strong>New Role:</strong> ${role}</li>` : ''}
        ${statusChanged ? `<li><strong>Status:</strong> ${status}</li>` : ''}
        ${
          orgsChanged
            ? `<li><strong>Units:</strong> ${organizations
                ?.map((o: { name: string }) => o.name)
                .join(', ')}</li>`
            : ''
        }
      </ul>

      <p style="font-size: 14px; color: #999; line-height: 1.5;">
        If this change was unexpected or you have any concerns, please contact support.
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

      <p style="font-size: 12px; color: #bbb; text-align: center;">
        &copy; ${new Date().getFullYear()} StyreIQ. All rights reserved.
      </p>
    </div>
  `
}
