// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Endpoint } from 'payload'
import type { User } from '@/types/payload-types'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import { createFakePayload, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import {
  createUser,
  getOrganizationUsers,
  requestDemo,
  setUserApprovalStatus,
  switchUserRole,
  updateUser,
  updateUserAccess,
  userForgotPassword,
  userResetPassword,
} from '../../plugins/endpoints'

type RequestOptions = Parameters<typeof createFakeRequest>[0]

const run = async (endpoint: Endpoint, options: RequestOptions) => {
  const { asRequest, payload } = createFakeRequest(options)
  const response = await endpoint.handler(asRequest())
  return { response, payload, body: await response.json() }
}

const superAdmin = buildUser({
  id: 1,
  name: 'Camila Ortega',
  email: 'camila.ortega@styreiq.com',
  roles: ['super_admin'],
  tenant: null,
})
const centralAdmin = buildUser({
  id: 2,
  name: 'Andrés Londoño',
  email: 'andres.londono@universidad-andina.edu',
  roles: ['central_admin'],
  tenant: 10,
})
const comunicaciones = buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' })
const unitAdmin = buildUser({
  id: 3,
  name: 'Sofía Mejía',
  email: 'sofia.mejia@universidad-andina.edu',
  roles: ['unit_admin'],
  organizations: [comunicaciones],
  tenant: 10,
})
const socialManager = buildUser({
  id: 4,
  name: 'Mateo Giraldo',
  email: 'mateo.giraldo@universidad-andina.edu',
  roles: ['social_media_manager'],
  organizations: [comunicaciones],
  tenant: 10,
})

const newUserBody = {
  name: 'Laura Pineda',
  email: 'laura.pineda@universidad-andina.edu',
  roles: ['social_media_manager'],
  organizations: ['100'],
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('createUser endpoint', () => {
  const payloadWithOrgInTenant = () => {
    const payload = createFakePayload()
    payload.findByID.mockImplementation(async ({ collection }: { collection: string }) =>
      collection === 'organization'
        ? comunicaciones
        : { id: 10, name: 'Universidad Andina', primaryUnit: null },
    )
    payload.create.mockImplementation(async ({ collection, data }) =>
      collection === 'users' ? { id: 55, tenant: 10, ...data } : { id: 900 },
    )
    return payload
  }

  it('should return 400 when the request has no JSON body', async () => {
    const { response, body } = await run(createUser, { user: centralAdmin })
    expect(response.status).toBe(400)
    expect(body.error).toBe('Missing JSON body')
  })

  it('should return 401 when the caller is not authenticated', async () => {
    const { response } = await run(createUser, { body: newUserBody })
    expect(response.status).toBe(401)
  })

  it('should return 403 when the caller cannot create users', async () => {
    const { response, body } = await run(createUser, { user: socialManager, body: newUserBody })
    expect(response.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })

  it('should return 403 when a central admin targets another tenant', async () => {
    const { response, body } = await run(createUser, {
      user: centralAdmin,
      body: { ...newUserBody, tenant: 99 },
    })
    expect(response.status).toBe(403)
    expect(body.error).toContain('different tenant')
  })

  it('should return 400 when the target organization does not exist', async () => {
    const { response, payload } = await run(createUser, { user: centralAdmin, body: newUserBody })
    expect(response.status).toBe(400)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should return 403 when a unit admin assigns a role above their own', async () => {
    const payload = payloadWithOrgInTenant()
    const { response, body } = await run(createUser, {
      user: unitAdmin,
      payload,
      body: { ...newUserBody, roles: ['central_admin'] },
    })
    expect(response.status).toBe(403)
    expect(body.error).toBe('Cannot assign a role above your own')
  })

  it('should return 403 when a unit admin assigns units outside their access', async () => {
    const payload = payloadWithOrgInTenant()
    const { response, body } = await run(createUser, {
      user: unitAdmin,
      payload,
      body: { ...newUserBody, organizations: ['555'] },
    })
    expect(response.status).toBe(403)
    expect(body.error).toBe('Cannot assign units outside your access')
  })

  it('should return 400 when a user with that email already exists', async () => {
    const payload = payloadWithOrgInTenant()
    payload.find.mockResolvedValue({ docs: [{ id: 77 }], totalDocs: 1 })
    const { response, body } = await run(createUser, {
      user: centralAdmin,
      payload,
      body: newUserBody,
    })
    expect(response.status).toBe(400)
    expect(body.details).toBe(77)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should create the user, grant permanent unit access and send the welcome email', async () => {
    const payload = payloadWithOrgInTenant()
    const { response, body } = await run(createUser, {
      user: centralAdmin,
      payload,
      body: newUserBody,
    })

    expect(response.status).toBe(201)
    expect(body.email).toBe(newUserBody.email)
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        data: expect.objectContaining({
          roles: ['social_media_manager'],
          active_role: 'social_media_manager',
          status: 'active',
          organizations: [100],
          tenant: 10,
        }),
      }),
    )
    expect(payload.create).toHaveBeenCalledWith({
      collection: 'organization_access',
      data: { organization: 100, user: 55, type: 'permanent' },
    })
    expect(payload.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'dev@styreiq.test', subject: 'Welcome to StyreIQ' }),
    )
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit_log',
        data: expect.objectContaining({ action: 'user_creation' }),
      }),
    )
  })

  it('should still create the user when the welcome email fails to send', async () => {
    const payload = payloadWithOrgInTenant()
    payload.sendEmail.mockRejectedValue(new Error('Resend unavailable'))
    const { response } = await run(createUser, { user: centralAdmin, payload, body: newUserBody })
    expect(response.status).toBe(201)
  })

  it('should create unit admin invitations as pending activation', async () => {
    const payload = payloadWithOrgInTenant()
    const { response } = await run(createUser, { user: unitAdmin, payload, body: newUserBody })
    expect(response.status).toBe(201)
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        data: expect.objectContaining({ status: 'pending_activation' }),
      }),
    )
  })

  it('should return 400 when the payload fails schema validation', async () => {
    const payload = payloadWithOrgInTenant()
    const { response } = await run(createUser, {
      user: centralAdmin,
      payload,
      body: { ...newUserBody, email: 'not-an-email' },
    })
    expect(response.status).toBe(400)
  })
})

describe('updateUser endpoint', () => {
  const updateBody = {
    id: 4,
    name: 'Mateo Giraldo',
    email: 'mateo.giraldo@universidad-andina.edu',
    roles: ['social_media_manager'],
    organizations: ['100'],
  }
  const existingManager: User = { ...socialManager, organizations: [comunicaciones] }

  const payloadWithTarget = (target: User | null = existingManager) => {
    const payload = createFakePayload()
    payload.findByID.mockImplementation(async ({ collection }: { collection: string }) =>
      collection === 'organization' ? comunicaciones : target,
    )
    payload.update.mockImplementation(async ({ data }) => ({ id: 4, ...data }))
    return payload
  }

  it('should return 401 when unauthenticated', async () => {
    const { response } = await run(updateUser, { body: updateBody })
    expect(response.status).toBe(401)
  })

  it('should return 400 when there is no JSON body', async () => {
    const { response } = await run(updateUser, { user: centralAdmin })
    expect(response.status).toBe(400)
  })

  it('should return 403 when a social media manager edits another user', async () => {
    const payload = payloadWithTarget({ ...existingManager, id: 8 })
    const { response } = await run(updateUser, {
      user: socialManager,
      payload,
      body: { ...updateBody, id: 8 },
    })
    expect(response.status).toBe(403)
  })

  it('should return 404 when the target user does not exist', async () => {
    const payload = payloadWithTarget(null)
    const { response } = await run(updateUser, { user: centralAdmin, payload, body: updateBody })
    expect(response.status).toBe(404)
  })

  it('should return 403 when the target user belongs to another tenant', async () => {
    const payload = payloadWithTarget({ ...existingManager, tenant: 99 })
    const { response, body } = await run(updateUser, {
      user: centralAdmin,
      payload,
      body: updateBody,
    })
    expect(response.status).toBe(403)
    expect(body.error).toContain('different tenant')
  })

  it('should return 403 when a central admin tries to grant super admin', async () => {
    const payload = payloadWithTarget()
    const { response, body } = await run(updateUser, {
      user: centralAdmin,
      payload,
      body: { ...updateBody, roles: ['super_admin'] },
    })
    expect(response.status).toBe(403)
    expect(body.error).toBe('Cannot assign a role above your own')
  })

  it('should return 403 when a non super admin changes their own roles', async () => {
    const self = buildUser({ ...centralAdmin, organizations: [comunicaciones] })
    const payload = payloadWithTarget(self)
    const { response, body } = await run(updateUser, {
      user: self,
      payload,
      body: { ...updateBody, id: self.id, roles: ['unit_admin'] },
    })
    expect(response.status).toBe(403)
    expect(body.error).toBe('Cannot change your own roles or units')
  })

  it('should return 403 when a unit admin manages a user outside their units', async () => {
    const outsider = buildUser({
      ...existingManager,
      organizations: [buildOrganization({ id: 555, name: 'Facultad de Artes' })],
    })
    const payload = payloadWithTarget(outsider)
    payload.find.mockResolvedValue({ docs: [], totalDocs: 0 })
    const { response, body } = await run(updateUser, {
      user: unitAdmin,
      payload,
      body: { ...updateBody, organizations: ['555'] },
    })
    expect(response.status).toBe(403)
    expect(body.error).toBe('Cannot manage users outside your units')
  })

  it('should return 403 when a tenant change is attempted by a non super admin', async () => {
    const payload = payloadWithTarget()
    const { response, body } = await run(updateUser, {
      user: centralAdmin,
      payload,
      body: { ...updateBody, tenant: 99 },
    })
    expect(response.status).toBe(403)
    expect(body.error).toBe('Cannot change user tenant')
  })

  it('should return 409 when disabling the only unit admin of an organization', async () => {
    const adminTarget = buildUser({
      id: 4,
      roles: ['unit_admin'],
      organizations: [comunicaciones],
      tenant: 10,
    })
    const payload = payloadWithTarget(adminTarget)
    payload.find.mockResolvedValue({ docs: [], totalDocs: 0 })
    const { response, body } = await run(updateUser, {
      user: centralAdmin,
      payload,
      body: { ...updateBody, roles: ['unit_admin'], status: 'inactive' },
    })
    expect(response.status).toBe(409)
    expect(body.organizations[0].name).toBe('Dirección de Comunicaciones')
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should update the user and replace their unit access', async () => {
    const payload = payloadWithTarget()
    const { response } = await run(updateUser, {
      user: centralAdmin,
      payload,
      body: { ...updateBody, name: 'Mateo Giraldo Ruiz' },
    })
    expect(response.status).toBe(200)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        id: 4,
        data: expect.objectContaining({ name: 'Mateo Giraldo Ruiz', organizations: [100] }),
      }),
    )
    expect(payload.delete).toHaveBeenCalledWith({
      collection: 'organization_access',
      where: { 'user.id': { equals: 4 } },
    })
    expect(payload.create).toHaveBeenCalledWith({
      collection: 'organization_access',
      data: { organization: 100, user: 4, type: 'permanent' },
    })
  })

  it('should return 400 when validation fails', async () => {
    const payload = payloadWithTarget()
    const { response } = await run(updateUser, {
      user: centralAdmin,
      payload,
      body: { ...updateBody, roles: [] },
    })
    expect(response.status).toBe(400)
  })
})

describe('updateUserAccess endpoint', () => {
  const accessBody = {
    access: [
      {
        id: 5,
        organization: 100,
        organization_name: 'Dirección de Comunicaciones',
        type: 'temporary',
        start_date: '2026-10-01',
        end_date: '2026-12-01',
      },
    ],
  }

  it('should return 401 when unauthenticated', async () => {
    const { response } = await run(updateUserAccess, { body: accessBody })
    expect(response.status).toBe(401)
  })

  it('should return 400 when there is no JSON body', async () => {
    const { response } = await run(updateUserAccess, { user: centralAdmin })
    expect(response.status).toBe(400)
  })

  it('should update each organization access record', async () => {
    const { response, body, payload } = await run(updateUserAccess, {
      user: centralAdmin,
      body: accessBody,
    })
    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'organization_access',
        id: 5,
        data: { type: 'temporary', start_date: '2026-10-01', end_date: '2026-12-01' },
      }),
    )
  })

  it('should return 400 when the access list is malformed', async () => {
    const { response } = await run(updateUserAccess, {
      user: centralAdmin,
      body: { access: 'none' },
    })
    expect(response.status).toBe(400)
  })
})

describe('setUserApprovalStatus endpoint', () => {
  it('should return 401 when the caller is not a super admin', async () => {
    const { response } = await run(setUserApprovalStatus, {
      user: centralAdmin,
      body: { id: 4, approved: true },
    })
    expect(response.status).toBe(401)
  })

  it('should return 400 when there is no JSON body', async () => {
    const { response } = await run(setUserApprovalStatus, { user: superAdmin })
    expect(response.status).toBe(400)
  })

  it('should return 404 when the user does not exist', async () => {
    const { response } = await run(setUserApprovalStatus, {
      user: superAdmin,
      body: { id: 4, approved: true },
    })
    expect(response.status).toBe(404)
  })

  it('should activate the user when approved', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(socialManager)
    const { response } = await run(setUserApprovalStatus, {
      user: superAdmin,
      payload,
      body: { id: 4, approved: true },
    })
    expect(response.status).toBe(200)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'active' } }),
    )
  })

  it('should reject the user and store the reason when not approved', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(socialManager)
    await run(setUserApprovalStatus, {
      user: superAdmin,
      payload,
      body: { id: 4, approved: false, reason: 'Cuenta duplicada en la Facultad de Artes' },
    })
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'rejected', reject_reason: 'Cuenta duplicada en la Facultad de Artes' },
      }),
    )
  })

  it('should return 400 when rejecting without a reason', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(socialManager)
    const { response } = await run(setUserApprovalStatus, {
      user: superAdmin,
      payload,
      body: { id: 4, approved: false },
    })
    expect(response.status).toBe(400)
  })
})

describe('getOrganizationUsers endpoint', () => {
  it('should return 401 when unauthenticated', async () => {
    const { response } = await run(getOrganizationUsers, {})
    expect(response.status).toBe(401)
  })

  it('should list users filtered by the organizations the caller can see', async () => {
    const payload = createFakePayload()
    payload.find.mockImplementation(async ({ collection }: { collection: string }) => ({
      docs: collection === 'organization' ? [comunicaciones] : [socialManager],
      totalDocs: 1,
    }))
    const { response, body } = await run(getOrganizationUsers, {
      user: unitAdmin,
      payload,
      searchParams: { limit: '5', page: '2' },
    })
    expect(response.status).toBe(200)
    expect(body.docs).toHaveLength(1)
    expect(payload.find).toHaveBeenLastCalledWith({
      collection: 'users',
      where: { 'organizations.id': { in: [100] } },
      limit: 5,
      page: 2,
    })
  })

  it('should not filter by organization for a super admin without organizations', async () => {
    const payload = createFakePayload()
    await run(getOrganizationUsers, { user: superAdmin, payload })
    expect(payload.find).toHaveBeenLastCalledWith(
      expect.objectContaining({ collection: 'users', where: {}, limit: 10, page: 0 }),
    )
  })

  it('should return 400 when the lookup fails', async () => {
    const payload = createFakePayload()
    payload.find.mockRejectedValue(new Error('database offline'))
    const { response } = await run(getOrganizationUsers, { user: centralAdmin, payload })
    expect(response.status).toBe(400)
  })
})

describe('userForgotPassword endpoint', () => {
  const withAuthMethods = () => {
    const payload = createFakePayload()
    const forgotPassword = vi.fn().mockResolvedValue('reset-token-123')
    return { payload: Object.assign(payload, { forgotPassword }), forgotPassword }
  }

  it('should return 400 when there is no JSON body', async () => {
    const { response } = await run(userForgotPassword, {})
    expect(response.status).toBe(400)
  })

  it('should return 404 with a generic message when the email is unknown', async () => {
    const { payload } = withAuthMethods()
    const { response, body } = await run(userForgotPassword, {
      payload,
      body: { email: 'nadie@universidad-andina.edu' },
    })
    expect(response.status).toBe(404)
    expect(body.error).toContain('If that email address is in our database')
  })

  it('should generate a token, email it and write an audit log entry', async () => {
    const { payload, forgotPassword } = withAuthMethods()
    payload.find.mockResolvedValue({ docs: [socialManager], totalDocs: 1 })
    const { response, body } = await run(userForgotPassword, {
      payload,
      body: { email: socialManager.email },
    })
    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(forgotPassword).toHaveBeenCalledWith(
      expect.objectContaining({ data: { email: socialManager.email }, disableEmail: true }),
    )
    const mail = payload.sendEmail.mock.calls[0][0]
    expect(mail.subject).toBe('Password recovery instructions')
    expect(mail.html).toContain('reset-token-123')
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit_log',
        data: expect.objectContaining({ entity: 'password_recovery' }),
      }),
    )
  })

  it('should still succeed when the recovery email cannot be delivered', async () => {
    const { payload } = withAuthMethods()
    payload.find.mockResolvedValue({ docs: [socialManager], totalDocs: 1 })
    payload.sendEmail.mockRejectedValue(new Error('Resend unavailable'))
    const { response } = await run(userForgotPassword, {
      payload,
      body: { email: socialManager.email },
    })
    expect(response.status).toBe(200)
  })

  it('should return 400 for an invalid email address', async () => {
    const { payload } = withAuthMethods()
    const { response } = await run(userForgotPassword, { payload, body: { email: 'sin-arroba' } })
    expect(response.status).toBe(400)
  })
})

describe('userResetPassword endpoint', () => {
  const withReset = (user: unknown) => {
    const payload = createFakePayload()
    const resetPassword = vi.fn().mockResolvedValue({ user })
    return { payload: Object.assign(payload, { resetPassword }), resetPassword }
  }

  it('should return 400 when there is no JSON body', async () => {
    const { response } = await run(userResetPassword, {})
    expect(response.status).toBe(400)
  })

  it('should reset the password, unlock the account and send a confirmation', async () => {
    const { payload, resetPassword } = withReset({
      id: 4,
      email: socialManager.email,
      name: socialManager.name,
    })
    const { response, body } = await run(userResetPassword, {
      payload,
      body: { token: 'reset-token-123', password: 'NuevaClave#2026' },
    })
    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(resetPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { password: 'NuevaClave#2026', token: 'reset-token-123' },
      }),
    )
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { lockUntil: null, loginAttempts: 0 } }),
    )
    expect(payload.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Your account password was changed' }),
    )
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ entity: 'password_reset' }),
      }),
    )
  })

  it('should return 400 when Payload rejects the token', async () => {
    const payload = createFakePayload()
    const resetPassword = vi.fn().mockRejectedValue(new Error('Token is either invalid or expired'))
    const { response } = await run(userResetPassword, {
      payload: Object.assign(payload, { resetPassword }),
      body: { token: 'expired', password: 'NuevaClave#2026' },
    })
    expect(response.status).toBe(400)
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should succeed even if the confirmation email fails', async () => {
    const { payload } = withReset({ id: 4, email: socialManager.email, name: socialManager.name })
    payload.sendEmail.mockRejectedValue(new Error('Resend unavailable'))
    const { response } = await run(userResetPassword, {
      payload,
      body: { token: 'reset-token-123', password: 'NuevaClave#2026' },
    })
    expect(response.status).toBe(200)
  })
})

describe('requestDemo endpoint', () => {
  const demoBody = {
    name: 'Rodrigo Salazar',
    email: 'rodrigo.salazar@colegio-sanpablo.edu',
    company: 'Colegio San Pablo',
    role: 'Director de Comunicaciones',
  }

  it('should return 400 when there is no JSON body', async () => {
    const { response } = await run(requestDemo, {})
    expect(response.status).toBe(400)
  })

  it('should return 400 with the validation issues for an invalid request', async () => {
    const { response, body } = await run(requestDemo, { body: { name: ' ', email: 'x' } })
    expect(response.status).toBe(400)
    expect(body.error).toBe('Invalid demo request')
    expect(body.details.length).toBeGreaterThan(0)
  })

  it('should send the internal notification and the confirmation email', async () => {
    const payload = createFakePayload()
    payload.sendEmail.mockResolvedValue({ id: 'email_1' })
    const { response, body } = await run(requestDemo, { payload, body: demoBody })
    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(payload.sendEmail).toHaveBeenCalledTimes(2)
    expect(payload.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: demoBody.email, subject: 'New demo request' }),
    )
    expect(payload.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Thanks for your interest in StyreIQ' }),
    )
  })

  it('should return 500 when the email service does not return an id', async () => {
    const payload = createFakePayload()
    const { response, body } = await run(requestDemo, { payload, body: demoBody })
    expect(response.status).toBe(500)
    expect(body.error).toBe('Unexpected error in requestDemo')
  })
})

describe('switchUserRole endpoint', () => {
  const multiRole = buildUser({ id: 9, roles: ['unit_admin', 'social_media_manager'] })

  it('should return 400 when there is no JSON body', async () => {
    const { response } = await run(switchUserRole, { user: multiRole })
    expect(response.status).toBe(400)
  })

  it('should return 401 when unauthenticated', async () => {
    const { response } = await run(switchUserRole, { body: { role: 'unit_admin' } })
    expect(response.status).toBe(401)
  })

  it('should return 400 when the role is missing', async () => {
    const { response, body } = await run(switchUserRole, { user: multiRole, body: {} })
    expect(response.status).toBe(400)
    expect(body.error).toBe('Role is required')
  })

  it('should return 400 when the role is not a known role', async () => {
    const { response, body } = await run(switchUserRole, {
      user: multiRole,
      body: { role: 'owner' },
    })
    expect(response.status).toBe(400)
    expect(body.error).toBe('Invalid role')
  })

  it('should return 403 when the user does not hold the requested role', async () => {
    const { response, body } = await run(switchUserRole, {
      user: multiRole,
      body: { role: 'central_admin' },
    })
    expect(response.status).toBe(403)
    expect(body.error).toBe('You do not have this role')
  })

  it('should update the active role when the user holds it', async () => {
    const payload = createFakePayload()
    payload.update.mockResolvedValue({ id: 9, active_role: 'social_media_manager' })
    const { response, body } = await run(switchUserRole, {
      user: multiRole,
      payload,
      body: { role: 'social_media_manager' },
    })
    expect(response.status).toBe(200)
    expect(body.activeRole).toBe('social_media_manager')
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 9, data: { active_role: 'social_media_manager' } }),
    )
  })

  it('should return 500 when the update fails', async () => {
    const payload = createFakePayload()
    payload.update.mockRejectedValue(new Error('database offline'))
    const { response } = await run(switchUserRole, {
      user: multiRole,
      payload,
      body: { role: 'unit_admin' },
    })
    expect(response.status).toBe(500)
  })
})
