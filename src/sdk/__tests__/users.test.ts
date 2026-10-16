import { describe, expect, it } from 'vitest'
import {
  createFirstUser,
  createUser,
  createWelcomeEmail,
  logout,
  resetPasswordRequest,
  sendForgotPasswordRequest,
  setUserApprovalStatus,
  switchRoleRequest,
  updateUser,
  updateUserAccess,
} from '../users'
import { UserRolesEnum, UserStatusEnum } from '@/features/users'
import { UserAccessTypeEnum } from '@/features/units'
import { BASE_URL, htmlResponse, jsonResponse, setupFetchMock } from './sdk-fetch'

const { fetchMock, lastCall } = setupFetchMock()

describe('createFirstUser', () => {
  it('should post only name, email and password and return the created user', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 1 }))
    const result = await createFirstUser({
      name: 'Valentina Restrepo',
      email: 'valentina.restrepo@universidad-andina.edu',
      password: 'Andina#2026',
    })
    const { url, init, body } = lastCall()
    expect(url).toBe(`${BASE_URL}/api/create-first-user`)
    expect(init.method).toBe('POST')
    expect(body).toEqual({
      name: 'Valentina Restrepo',
      email: 'valentina.restrepo@universidad-andina.edu',
      password: 'Andina#2026',
    })
    expect(result).toEqual({ id: 1 })
  })

  it('should surface the server message and details when the request is rejected', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, { message: 'This action is not permitted.', details: 'already seeded' }),
    )
    await expect(
      createFirstUser({ name: 'A', email: 'a@universidad-andina.edu', password: 'Andina#2026' }),
    ).rejects.toEqual({
      message: 'Failed to create user',
      data: { message: 'This action is not permitted.', details: 'already seeded' },
    })
  })
})

describe('createUser', () => {
  const baseUser = {
    name: 'Camilo Ospina',
    email: 'camilo.ospina@universidad-andina.edu',
    roles: [UserRolesEnum.UnitAdmin],
    status: UserStatusEnum.Active,
    organizations: ['100'],
    tenant: 10,
  }

  it('should omit the password when none was provided', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 5 }))
    await createUser(baseUser)
    expect(lastCall().body).not.toHaveProperty('password')
    expect(lastCall().body).toMatchObject({ tenant: 10, organizations: ['100'] })
  })

  it('should include the password when one was provided', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 5 }))
    await createUser({ ...baseUser, password: 'Andina#2026' })
    expect(lastCall().body.password).toBe('Andina#2026')
  })

  it('should throw the server message and details on failure', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { message: 'Email already exists', details: [] }))
    await expect(createUser(baseUser)).rejects.toMatchObject({
      message: 'Failed to create user',
      data: { message: 'Email already exists' },
    })
  })
})

describe('updateUser', () => {
  const update = {
    id: 7,
    name: 'Camilo Ospina',
    email: 'camilo.ospina@universidad-andina.edu',
    roles: [UserRolesEnum.CentralAdmin],
    organizations: ['100'],
    active_role: UserRolesEnum.CentralAdmin,
    status: UserStatusEnum.Inactive,
  }

  it('should patch the user with the editable fields', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 7 }))
    await updateUser(update)
    const { url, init, body } = lastCall()
    expect(url).toBe(`${BASE_URL}/api/users/`)
    expect(init.method).toBe('PATCH')
    expect(body).toMatchObject({ id: 7, status: 'inactive', active_role: 'central_admin' })
  })

  it('should expose the endpoint error text and status', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { error: 'Not allowed to edit this user' }))
    await expect(updateUser(update)).rejects.toMatchObject({
      message: 'Not allowed to edit this user',
      status: 403,
    })
  })

  it('should fall back to a generic message when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(htmlResponse(502))
    await expect(updateUser(update)).rejects.toMatchObject({
      message: 'Failed to update user',
      status: 502,
    })
  })
})

describe('updateUserAccess', () => {
  const access = {
    access: [
      {
        id: 1,
        organization: 100,
        organization_name: 'Dirección de Comunicaciones',
        type: UserAccessTypeEnum.Permanent,
      },
    ],
  }

  it('should send the access list', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))
    await expect(updateUserAccess(access)).resolves.toEqual({ ok: true })
    expect(lastCall().body).toEqual(access)
    expect(lastCall().url).toBe(`${BASE_URL}/api/users/access`)
  })

  it('should throw the Payload error message when the update is rejected', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, { errors: [{ message: 'End date must be in the future' }] }),
    )
    await expect(updateUserAccess(access)).rejects.toThrow('End date must be in the future')
  })

  it('should throw the fallback message when the body is not JSON', async () => {
    fetchMock.mockResolvedValue(htmlResponse(500))
    await expect(updateUserAccess(access)).rejects.toThrow('Failed to update user access')
  })
})

describe('logout', () => {
  it('should forward the session cookie and return the parsed body', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { message: 'Logged out' }))
    const result = await logout({ cookie: 'payload-token=abc123' })
    const { url, init } = lastCall()
    expect(url).toBe(`${BASE_URL}/api/users/logout`)
    expect(init.headers).toMatchObject({ cookie: 'payload-token=abc123' })
    expect(result).toEqual({ message: 'Logged out' })
  })
})

describe('setUserApprovalStatus', () => {
  it('should put the decision', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))
    await setUserApprovalStatus({ data: { id: 9, approved: false, reason: 'Cuenta duplicada' } })
    expect(lastCall().init.method).toBe('PUT')
    expect(lastCall().body).toEqual({ id: 9, approved: false, reason: 'Cuenta duplicada' })
  })

  it('should throw when the server rejects the decision', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    await expect(setUserApprovalStatus({ data: { id: 9, approved: true } })).rejects.toThrow(
      'Failed to set user status',
    )
  })
})

describe('password recovery requests', () => {
  it('should post the email to request a reset link', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))
    await sendForgotPasswordRequest({ email: 'valentina.restrepo@universidad-andina.edu' })
    expect(lastCall().url).toBe(`${BASE_URL}/api/users/forgot-password`)
    expect(lastCall().body).toEqual({ email: 'valentina.restrepo@universidad-andina.edu' })
  })

  it('should throw when the reset link could not be requested', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    await expect(sendForgotPasswordRequest({ email: 'x@universidad-andina.edu' })).rejects.toThrow(
      'Failed to send forgot password email instructions',
    )
  })

  it('should post the token and new password to reset it', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))
    await resetPasswordRequest({ token: 'tok-9f2', password: 'Andina#2027' })
    expect(lastCall().url).toBe(`${BASE_URL}/api/users/reset-password`)
    expect(lastCall().body).toEqual({ token: 'tok-9f2', password: 'Andina#2027' })
  })

  it('should throw when the reset token is rejected', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, {}))
    await expect(
      resetPasswordRequest({ token: 'expired', password: 'Andina#2027' }),
    ).rejects.toThrow('Failed to reset password')
  })
})

describe('createWelcomeEmail', () => {
  const welcome = {
    instructions: 'Complete su capacitación en la primera semana.',
    responsibilities: [{ responsibility: 'Publicar contenido institucional' }],
  }

  it('should post the welcome email content', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 3 }))
    await expect(createWelcomeEmail(welcome)).resolves.toEqual({ id: 3 })
    expect(lastCall().body).toEqual(welcome)
  })

  it('should throw the server message and details on failure', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, { message: 'Invalid link', details: 'policyLinks' }),
    )
    await expect(createWelcomeEmail(welcome)).rejects.toEqual({
      message: 'Failed to create welcome email',
      data: { message: 'Invalid link', details: 'policyLinks' },
    })
  })
})

describe('switchRoleRequest', () => {
  it('should post the requested role', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { active_role: 'unit_admin' }))
    await switchRoleRequest(UserRolesEnum.UnitAdmin)
    expect(lastCall().body).toEqual({ role: 'unit_admin' })
  })

  it('should prefer the error field, then message, then the fallback', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(403, { error: 'Role not assigned' }))
    await expect(switchRoleRequest(UserRolesEnum.SuperAdmin)).rejects.toThrow('Role not assigned')
    fetchMock.mockResolvedValueOnce(jsonResponse(403, { message: 'Forbidden role' }))
    await expect(switchRoleRequest(UserRolesEnum.SuperAdmin)).rejects.toThrow('Forbidden role')
    fetchMock.mockResolvedValueOnce(htmlResponse(500))
    await expect(switchRoleRequest(UserRolesEnum.SuperAdmin)).rejects.toThrow(
      'Failed to switch role',
    )
  })
})
