import { Organization, User } from '@/types/payload-types'
import { Payload } from 'payload'
import { updatedPermsEmailBody } from '../constants/updatedPermsEmailBody'

interface CheckAndSendPermissionChangeEmailOptions {
  payload: Payload
  originalUser: User
  updatedData: {
    name: string
    email: string
    role: User['role']
    status: User['status']
    organizations?: Organization[]
  }
}

export const checkAndSendPermissionChangeEmail = async ({
  payload,
  originalUser,
  updatedData,
}: CheckAndSendPermissionChangeEmailOptions): Promise<void> => {
  const roleChanged = originalUser.role !== updatedData.role
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

  if (!(roleChanged || statusChanged || orgsChanged)) return
  await payload.sendEmail({
    to: updatedData.email,
    subject: 'Your Permissions Have Been Updated',
    html: updatedPermsEmailBody({
      name: updatedData.name,
      status: updatedData.status,
      role: updatedData.role,
      organizations: updatedData.organizations,
      statusChanged,
      roleChanged,
      orgsChanged,
    }),
  })
}
