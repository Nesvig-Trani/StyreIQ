import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import { UserRolesEnum } from '@/shared/constants/user-roles'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import { checkAndSendPermissionChangeEmail } from '../../utils/permissionChangeEmail'

const sendEmail = vi.fn<Payload['sendEmail']>()
// Only the email boundary of Payload is faked; the change-detection logic is the real code.
const payload: Pick<Payload, 'sendEmail'> = { sendEmail }

const comunicaciones = buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' })
const artes = buildOrganization({ id: 101, name: 'Facultad de Artes' })

const originalUser = buildUser({
  id: 12,
  name: 'Mateo Giraldo',
  email: 'mateo.giraldo@universidad-andina.edu',
  roles: ['social_media_manager'],
  status: 'active',
  organizations: [comunicaciones],
})

const send = (
  updatedData: Parameters<typeof checkAndSendPermissionChangeEmail>[0]['updatedData'],
) => checkAndSendPermissionChangeEmail({ payload: payload as Payload, originalUser, updatedData })

beforeEach(() => sendEmail.mockReset())

describe('checkAndSendPermissionChangeEmail', () => {
  it('should not email when roles, status and units are unchanged', async () => {
    await send({
      name: originalUser.name,
      email: originalUser.email,
      roles: [UserRolesEnum.SocialMediaManager],
      status: 'active',
      organizations: [comunicaciones],
    })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('should email the user when a role is added', async () => {
    await send({
      name: originalUser.name,
      email: originalUser.email,
      roles: [UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager],
      status: 'active',
      organizations: [comunicaciones],
    })
    expect(sendEmail).toHaveBeenCalledOnce()
    expect(sendEmail.mock.calls[0][0]).toMatchObject({
      to: 'mateo.giraldo@universidad-andina.edu',
      subject: 'Your Permissions Have Been Updated',
    })
  })

  it('should email the user when their units change', async () => {
    await send({
      name: originalUser.name,
      email: originalUser.email,
      status: 'active',
      organizations: [comunicaciones, artes],
    })
    expect(sendEmail).toHaveBeenCalledOnce()
  })

  it('should email the user when their status changes', async () => {
    await send({
      name: originalUser.name,
      email: originalUser.email,
      status: 'inactive',
      organizations: [comunicaciones],
    })
    expect(sendEmail).toHaveBeenCalledOnce()
  })
})
