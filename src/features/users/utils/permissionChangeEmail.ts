import { Organization, User } from '@/types/payload-types'
import { Payload } from 'payload'
import { updatedPermsEmailBody } from '../constants/updatedPermsEmailBody'
import { normalizeRoles, getHighestRole } from '@/shared/utils/role-hierarchy'
import { UserRolesEnum } from '@/features/users/schemas'

interface CheckAndSendPermissionChangeEmailOptions {
  payload: Payload
  originalUser: User
  updatedData: {
    name: string
    email: string
    roles?: UserRolesEnum[]
    active_role?: UserRolesEnum
    status: User['status']
    organizations?: Organization[]
  }
}

export const checkAndSendPermissionChangeEmail = async ({
  payload,
  originalUser,
  updatedData,
}: CheckAndSendPermissionChangeEmailOptions): Promise<void> => {
  const originalRoles = normalizeRoles(originalUser.roles)

  const updatedRoles =
    updatedData.roles && updatedData.roles.length > 0
      ? normalizeRoles(updatedData.roles)
      : originalRoles

  const rolesChanged =
    originalRoles.length !== updatedRoles.length ||
    originalRoles.some((role) => !updatedRoles.includes(role)) ||
    updatedRoles.some((role) => !originalRoles.includes(role))

  const activeRole = updatedData.active_role ?? getHighestRole(updatedRoles)

  const statusChanged = originalUser.status !== updatedData.status

  const existingOrgIds = (originalUser.organizations || []).map((org) =>
    typeof org === 'object' ? org.id : org,
  )
  const updatedOrgIds = (updatedData.organizations || []).map((org) =>
    typeof org === 'object' ? org.id : Number(org),
  )
  const orgsChanged =
    existingOrgIds.length !== updatedOrgIds.length ||
    existingOrgIds.some((id) => !updatedOrgIds.includes(id)) ||
    updatedOrgIds.some((id) => !existingOrgIds.includes(id))

  if (!(rolesChanged || statusChanged || orgsChanged)) return

  await payload.sendEmail({
    to: updatedData.email,
    subject: 'Your Permissions Have Been Updated',
    html: updatedPermsEmailBody({
      name: updatedData.name,
      status: updatedData.status,
      role: activeRole,
      roles: updatedRoles,
      organizations: updatedData.organizations,
      statusChanged,
      roleChanged: rolesChanged,
      orgsChanged,
    }),
  })
}
