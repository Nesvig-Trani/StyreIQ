import { UserRolesEnum } from '@/features/users/schemas'

type updatedPermsProps = {
  name: string
  role?: UserRolesEnum | null
  roles?: UserRolesEnum[]
  status?: string | null
  organizations?: { name: string }[]
  roleChanged: boolean
  statusChanged: boolean
  orgsChanged: boolean
}

const roleLabelMap: Record<UserRolesEnum, string> = {
  [UserRolesEnum.SuperAdmin]: 'Super Admin',
  [UserRolesEnum.CentralAdmin]: 'Central Admin',
  [UserRolesEnum.UnitAdmin]: 'Unit Admin',
  [UserRolesEnum.SocialMediaManager]: 'Social Media Manager',
}

export const updatedPermsEmailBody = ({
  name,
  role,
  roles,
  status,
  organizations,
  roleChanged,
  statusChanged,
  orgsChanged,
}: updatedPermsProps) => {
  const rolesToDisplay = roles && roles.length > 0 ? roles : role ? [role] : []
  const roleLabels = rolesToDisplay.map((r) => roleLabelMap[r] || r).join(', ')

  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #fafafa;">
      <h1 style="color: #222; font-size: 24px;">Hello ${name || 'User'},</h1>

      <p style="font-size: 16px; line-height: 1.5; color: #555;">
        We wanted to inform you that your account permissions have been updated. Here are the details:
      </p>

      <ul style="font-size: 16px; color: #555; line-height: 1.6; padding-left: 20px;">
        ${
          roleChanged
            ? `<li><strong>${rolesToDisplay.length > 1 ? 'Roles' : 'Role'}:</strong> ${roleLabels}</li>`
            : ''
        }
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
