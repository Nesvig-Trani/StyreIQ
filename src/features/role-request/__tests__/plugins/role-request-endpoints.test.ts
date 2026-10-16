import { describe, expect, it } from 'vitest'
import { approveRoleRequest, createRoleRequest } from '../../plugins/endpoints'
import { UserRolesEnum } from '@/features/users'
import { createFakePayload, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const requestBody = {
  requestedRole: UserRolesEnum.UnitAdmin,
  organization: '100',
  justification: 'Necesito administrar la Dirección de Comunicaciones durante el semestre.',
}

const callCreate = (options: Parameters<typeof createFakeRequest>[0]) => {
  const { asRequest, payload, fake } = createFakeRequest(options)
  return { payload, fake, run: () => createRoleRequest.handler(asRequest()) }
}

describe('createRoleRequest endpoint', () => {
  it('should return 401 when the caller is not authenticated', async () => {
    const { run, payload } = callCreate({ user: null, body: requestBody })
    const response = await run()
    expect(response.status).toBe(401)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should return 400 when the request has no JSON body', async () => {
    const { run } = callCreate({ user: buildUser() })
    const response = await run()
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Missing JSON body' })
  })

  it('should return 400 when the user already holds the requested role', async () => {
    const { run, payload } = callCreate({
      user: buildUser({ roles: [UserRolesEnum.UnitAdmin] }),
      body: requestBody,
    })
    const response = await run()
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'You already have this role' })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should return 400 when someone asks for the SuperAdmin role', async () => {
    const { run } = callCreate({
      user: buildUser(),
      body: { ...requestBody, requestedRole: UserRolesEnum.SuperAdmin },
    })
    const response = await run()
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Cannot request SuperAdmin role' })
  })

  it('should return 400 when a SuperAdmin has not selected a tenant', async () => {
    const { run } = callCreate({
      user: buildUser({ roles: [UserRolesEnum.SuperAdmin] }),
      body: requestBody,
    })
    const response = await run()
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'SuperAdmin must select a tenant first' })
  })

  it('should use the tenant from the selected-tenant cookie when the caller is a SuperAdmin', async () => {
    const { run, payload, fake } = callCreate({
      user: buildUser({ roles: [UserRolesEnum.SuperAdmin, UserRolesEnum.CentralAdmin] }),
      body: requestBody,
    })
    fake.headers.set('cookie', 'styreiq_selected_tenant=77')
    const response = await run()
    expect(response.status).toBe(201)
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenant: 77 }) }),
    )
  })

  it('should return 400 when the user has no tenant assigned', async () => {
    const { run } = callCreate({ user: buildUser({ tenant: null }), body: requestBody })
    const response = await run()
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'User has no tenant assigned' })
  })

  it('should create a pending request in the user tenant and return 201', async () => {
    const user = buildUser({ id: 31, tenant: 10 })
    const { run, payload } = callCreate({ user, body: requestBody })
    payload.create.mockResolvedValue({ id: 5, status: 'pending' })

    const response = await run()

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({
      success: true,
      message: 'Role request submitted successfully',
      data: { id: 5, status: 'pending' },
    })
    expect(payload.create).toHaveBeenCalledWith({
      collection: 'role-requests',
      data: {
        user: 31,
        requestedRole: UserRolesEnum.UnitAdmin,
        unitId: 100,
        justification: requestBody.justification,
        status: 'pending',
        tenant: 10,
      },
    })
  })

  it('should return 500 with the error detail when the database rejects the request', async () => {
    const { run, payload } = callCreate({ user: buildUser(), body: requestBody })
    payload.create.mockRejectedValue(new Error('Justification is too short'))

    const response = await run()

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: 'Failed to create role request',
      details: 'Justification is too short',
    })
  })

  it('should stringify non-Error failures in the 500 response', async () => {
    const { run, payload } = callCreate({ user: buildUser(), body: requestBody })
    payload.create.mockRejectedValue('connection lost')

    const response = await run()

    expect(response.status).toBe(500)
    expect((await response.json()).details).toBe('connection lost')
  })
})

const pendingRequest = {
  id: 9,
  status: 'pending',
  user: 31,
  requestedRole: UserRolesEnum.UnitAdmin,
  unitId: 100,
}

const setupApproval = ({
  user = buildUser({ id: 2, roles: [UserRolesEnum.CentralAdmin] }),
  body = { approved: true, reviewNotes: 'Aprobado por la Dirección' },
  roleRequest = pendingRequest,
  requester = buildUser({ id: 31, roles: [UserRolesEnum.SocialMediaManager], organizations: [] }),
}: {
  user?: ReturnType<typeof buildUser> | null
  body?: unknown
  roleRequest?: Record<string, unknown>
  requester?: ReturnType<typeof buildUser>
} = {}) => {
  const payload = createFakePayload()
  payload.findByID.mockImplementation(async ({ collection }: { collection: string }) =>
    collection === 'role-requests' ? roleRequest : requester,
  )
  const { asRequest } = createFakeRequest({ user, payload, body, routeParams: { id: '9' } })
  return { payload, run: () => approveRoleRequest.handler(asRequest()) }
}

describe('approveRoleRequest endpoint', () => {
  it('should return 401 when the caller is not authenticated', async () => {
    const { run } = setupApproval({ user: null })
    expect((await run()).status).toBe(401)
  })

  it('should return 400 when the request has no JSON body', async () => {
    const payload = createFakePayload()
    const { asRequest } = createFakeRequest({
      user: buildUser({ roles: [UserRolesEnum.CentralAdmin] }),
      payload,
      routeParams: { id: '9' },
    })
    const response = await approveRoleRequest.handler(asRequest())
    expect(response.status).toBe(400)
  })

  it('should return 403 when a Unit Admin tries to review a request', async () => {
    const { run, payload } = setupApproval({
      user: buildUser({ roles: [UserRolesEnum.UnitAdmin] }),
    })
    const response = await run()
    expect(response.status).toBe(403)
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should return 400 when the request was already processed', async () => {
    const { run, payload } = setupApproval({
      roleRequest: { ...pendingRequest, status: 'approved' },
    })
    const response = await run()
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'This request has already been processed' })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should mark the request rejected without touching the user when approved is false', async () => {
    const { run, payload } = setupApproval({
      body: { approved: false, reviewNotes: 'Sin justificación suficiente' },
    })

    const response = await run()

    expect(await response.json()).toEqual({ success: true, message: 'Role request rejected' })
    expect(payload.update).toHaveBeenCalledTimes(1)
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'role-requests',
      id: '9',
      data: { status: 'rejected', approvedBy: 2, reviewNotes: 'Sin justificación suficiente' },
    })
  })

  it('should return 400 when the requester already has the role', async () => {
    const { run, payload } = setupApproval({
      requester: buildUser({ id: 31, roles: [UserRolesEnum.UnitAdmin] }),
    })
    const response = await run()
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'User already has this role' })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should grant the role, the unit access, close the request and audit the approval', async () => {
    const { run, payload } = setupApproval({
      requester: buildUser({
        id: 31,
        tenant: 10,
        roles: [UserRolesEnum.SocialMediaManager],
        organizations: [55],
      }),
    })

    const response = await run()

    expect(await response.json()).toEqual({
      success: true,
      message: 'Role request approved successfully',
      data: {
        userId: 31,
        newRoles: [UserRolesEnum.SocialMediaManager, UserRolesEnum.UnitAdmin],
      },
    })
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 31,
      data: {
        roles: [UserRolesEnum.SocialMediaManager, UserRolesEnum.UnitAdmin],
        organizations: [55, 100],
      },
    })
    expect(payload.create).toHaveBeenCalledWith({
      collection: 'organization_access',
      data: { organization: 100, user: 31, type: 'permanent' },
    })
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'role-requests',
      id: '9',
      data: { status: 'approved', approvedBy: 2, reviewNotes: 'Aprobado por la Dirección' },
    })
    expect(payload.create).toHaveBeenCalledWith({
      collection: 'audit_log',
      data: expect.objectContaining({
        user: 2,
        action: 'role_request_approved',
        entity: 'role-requests',
        tenant: 10,
        metadata: expect.objectContaining({ grantedRole: UserRolesEnum.UnitAdmin, userId: 31 }),
      }),
    })
  })

  it('should resolve populated user and unit relations and not duplicate an existing unit', async () => {
    const { run, payload } = setupApproval({
      roleRequest: {
        ...pendingRequest,
        user: { id: 31 },
        unitId: { id: 55 },
      },
      requester: buildUser({
        id: 31,
        roles: [UserRolesEnum.SocialMediaManager],
        organizations: [buildOrganization({ id: 55 })],
      }),
    })

    await run()

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        id: 31,
        data: expect.objectContaining({ organizations: [55] }),
      }),
    )
  })

  it('should skip the unit access record when the request has no unit', async () => {
    const { run, payload } = setupApproval({ roleRequest: { ...pendingRequest, unitId: null } })

    await run()

    expect(payload.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'organization_access' }),
    )
  })
})
