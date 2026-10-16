import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'
import {
  createTenant,
  getAggregateMetrics,
  getSelectedTenant,
  getTenantMetrics,
  selectTenant,
  updateGovernanceSettings,
  updateTenant,
} from '@/features/tenants/plugins/endpoints'
import { COOKIE_MAX_AGE_SECONDS, SELECTED_TENANT_COOKIE_NAME } from '@/features/tenants/schemas'
import { createFakePayload, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildComplianceTask, buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import { buildTenant } from '../tenant-fixtures'

const superAdmin = buildUser({ id: 1, roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({ id: 2, roles: ['central_admin'], tenant: 10 })
const socialManager = buildUser({ id: 4, roles: ['social_media_manager'], tenant: 10 })

const validTenantBody = {
  name: 'Universidad Andina',
  domain: 'universidad-andina.edu',
  adminContactName: 'Camila Ortega',
  adminContactEmail: 'camila.ortega@universidad-andina.edu',
}

const run = async (endpoint: typeof createTenant, req: ReturnType<typeof createFakeRequest>) =>
  await endpoint.handler(req.asRequest())

describe('createTenant endpoint', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should reject requests without a JSON body', async () => {
    const req = createFakeRequest({ user: superAdmin })
    await expect(run(createTenant, req)).rejects.toMatchObject({
      message: 'Missing JSON body',
      code: 400,
    })
  })

  it('should return 401 for anonymous requests', async () => {
    const req = createFakeRequest({ user: null, body: validTenantBody })
    await expect(run(createTenant, req)).rejects.toMatchObject({ code: 401 })
  })

  it('should return 403 when a central admin tries to create a tenant', async () => {
    const req = createFakeRequest({ user: centralAdmin, body: validTenantBody })
    await expect(run(createTenant, req)).rejects.toMatchObject({
      message: 'Only Super Admins can create tenants',
      code: 403,
    })
    expect(req.payload.create).not.toHaveBeenCalled()
  })

  it('should fail validation for an invalid domain', async () => {
    const req = createFakeRequest({
      user: superAdmin,
      body: { ...validTenantBody, domain: 'not a domain' },
    })
    await expect(run(createTenant, req)).rejects.toBeInstanceOf(ZodError)
  })

  it('should return 409 when the domain is already registered', async () => {
    const payload = createFakePayload()
    payload.find.mockResolvedValue({ docs: [buildTenant()], totalDocs: 1 })
    const req = createFakeRequest({ user: superAdmin, payload, body: validTenantBody })
    await expect(run(createTenant, req)).rejects.toMatchObject({ code: 409 })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should create the tenant, its primary unit and an audit log entry', async () => {
    const payload = createFakePayload()
    payload.create
      .mockResolvedValueOnce(buildTenant({ id: 55 }))
      .mockResolvedValueOnce(buildOrganization({ id: 700 }))
      .mockResolvedValueOnce({ id: 1 })
    const req = createFakeRequest({ user: superAdmin, payload, body: validTenantBody })

    const pending = run(createTenant, req)
    await vi.advanceTimersByTimeAsync(500)
    const response = await pending

    expect(response).toBeInstanceOf(Response)
    expect(response.status).toBe(201)
    expect(payload.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'tenants',
        data: expect.objectContaining({
          domain: 'universidad-andina.edu',
          status: 'active',
          metadata: { timezone: 'America/New_York', notes: '' },
        }),
      }),
    )
    expect(payload.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'organization',
        data: expect.objectContaining({
          name: 'Universidad Andina - Primary Unit',
          tenant: 55,
          isPrimaryUnit: true,
        }),
      }),
    )
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'tenants', id: 55, data: { primaryUnit: 700 } }),
    )
    expect(payload.create).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        collection: 'audit_log',
        data: expect.objectContaining({ user: 1, entity: 'tenants', tenant: 55 }),
      }),
    )
  })
})

describe('getTenantMetrics endpoint', () => {
  const metricsRequest = (user: typeof centralAdmin | null, id: string) => {
    const payload = createFakePayload()
    payload.count.mockResolvedValueOnce({ totalDocs: 42 }).mockResolvedValueOnce({ totalDocs: 7 })
    payload.find.mockResolvedValue({
      docs: [
        buildComplianceTask({ id: 1, status: 'COMPLETED' }),
        buildComplianceTask({ id: 2, status: 'PENDING' }),
        buildComplianceTask({ id: 3, status: 'COMPLETED' }),
      ],
      totalDocs: 3,
    })
    return createFakeRequest({ user, payload, routeParams: { id } })
  }

  it('should return 401 for anonymous requests', async () => {
    const response = await run(getTenantMetrics, metricsRequest(null, '10'))
    expect(response.status).toBe(401)
  })

  it('should return 403 when a user requests another tenant metrics', async () => {
    const req = metricsRequest(centralAdmin, '11')
    const response = await run(getTenantMetrics, req)
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
    expect(req.payload.count).not.toHaveBeenCalled()
  })

  it('should return the metrics of the own tenant with the completion rate', async () => {
    const response = await run(getTenantMetrics, metricsRequest(centralAdmin, '10'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      totalUsers: 42,
      totalUnits: 7,
      totalTasks: 3,
      completedTasks: 2,
      completionRate: 67,
    })
  })

  it('should let a super admin read any tenant and report 0% without tasks', async () => {
    const req = metricsRequest(superAdmin, '99')
    req.payload.find.mockResolvedValue({ docs: [], totalDocs: 0 })
    const response = await run(getTenantMetrics, req)
    expect(response.status).toBe(200)
    expect((await response.json()).completionRate).toBe(0)
    expect(req.payload.count).toHaveBeenCalledWith({
      collection: 'users',
      where: { tenant: { equals: 99 } },
    })
  })
})

describe('getAggregateMetrics endpoint', () => {
  it('should return 403 for anyone but super admins', async () => {
    const anonymous = await run(getAggregateMetrics, createFakeRequest())
    const central = await run(getAggregateMetrics, createFakeRequest({ user: centralAdmin }))
    expect(anonymous.status).toBe(403)
    expect(central.status).toBe(403)
  })

  it('should aggregate users and tasks across active tenants', async () => {
    const payload = createFakePayload()
    payload.find
      .mockResolvedValueOnce({
        docs: [buildTenant({ id: 10 }), buildTenant({ id: 11, name: 'Colegio San Martín' })],
        totalDocs: 2,
      })
      .mockResolvedValueOnce({
        docs: [buildComplianceTask({ status: 'COMPLETED' })],
        totalDocs: 1,
      })
      .mockResolvedValueOnce({
        docs: [
          buildComplianceTask({ status: 'PENDING' }),
          buildComplianceTask({ status: 'PENDING' }),
        ],
        totalDocs: 2,
      })
    payload.count.mockResolvedValue({ totalDocs: 5 })
    const response = await run(
      getAggregateMetrics,
      createFakeRequest({ user: superAdmin, payload }),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      totalTenants: 2,
      aggregateMetrics: {
        totalUsers: 10,
        totalTasks: 3,
        totalCompletedTasks: 1,
        averageCompletionRate: 50,
      },
    })
  })

  it('should count a failing tenant as zero instead of failing the whole request', async () => {
    const payload = createFakePayload()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    payload.find.mockResolvedValueOnce({ docs: [buildTenant({ id: 10 })], totalDocs: 1 })
    payload.count.mockRejectedValue(new Error('db unavailable'))
    const response = await run(
      getAggregateMetrics,
      createFakeRequest({ user: superAdmin, payload }),
    )
    expect(response.status).toBe(200)
    expect((await response.json()).aggregateMetrics).toEqual({
      totalUsers: 0,
      totalTasks: 0,
      totalCompletedTasks: 0,
      averageCompletionRate: 0,
    })
  })

  it('should report zeros when there are no active tenants', async () => {
    const response = await run(getAggregateMetrics, createFakeRequest({ user: superAdmin }))
    expect((await response.json()).aggregateMetrics.averageCompletionRate).toBe(0)
  })
})

describe('updateGovernanceSettings endpoint', () => {
  const governanceBody = {
    reminderSchedule: [{ day: 2 }],
    escalationDays: [{ day: 10 }],
    rollCallFrequency: 'monthly',
    passwordUpdateCadenceDays: 90,
  }

  it('should require a tenant id', async () => {
    await expect(
      run(updateGovernanceSettings, createFakeRequest({ user: centralAdmin })),
    ).rejects.toMatchObject({ code: 400 })
  })

  it('should return 403 for roles that cannot modify governance', async () => {
    const req = createFakeRequest({
      user: socialManager,
      routeParams: { id: '10' },
      body: governanceBody,
    })
    await expect(run(updateGovernanceSettings, req)).rejects.toMatchObject({ code: 403 })
  })

  it('should return 403 when a central admin targets another tenant', async () => {
    const req = createFakeRequest({
      user: centralAdmin,
      routeParams: { id: '11' },
      body: governanceBody,
    })
    await expect(run(updateGovernanceSettings, req)).rejects.toMatchObject({
      message: 'Cannot modify other tenant settings',
      code: 403,
    })
    expect(req.payload.update).not.toHaveBeenCalled()
  })

  it('should require a JSON body', async () => {
    const req = createFakeRequest({ user: centralAdmin, routeParams: { id: '10' } })
    await expect(run(updateGovernanceSettings, req)).rejects.toMatchObject({ code: 400 })
  })

  it('should update the settings and write an audit log', async () => {
    const payload = createFakePayload()
    payload.update.mockResolvedValue(buildTenant())
    const req = createFakeRequest({
      user: centralAdmin,
      payload,
      routeParams: { id: '10' },
      body: governanceBody,
    })
    const response = await run(updateGovernanceSettings, req)
    expect(response.status).toBe(200)
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'tenants',
      id: 10,
      data: {
        governanceSettings: {
          reminderSchedule: [{ day: 2 }],
          escalationDays: [{ day: 10 }],
          rollCallFrequency: 'monthly',
          passwordUpdateCadenceDays: 90,
        },
      },
    })
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit_log',
        data: expect.objectContaining({ user: 2, tenant: 10, entity: 'tenants' }),
      }),
    )
  })

  it('should fall back to default governance values and let super admins edit any tenant', async () => {
    const payload = createFakePayload()
    const req = createFakeRequest({
      user: superAdmin,
      payload,
      routeParams: { id: '77' },
      body: {},
    })
    const response = await run(updateGovernanceSettings, req)
    expect(response.status).toBe(200)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 77,
        data: {
          governanceSettings: {
            reminderSchedule: [{ day: 3 }, { day: 7 }, { day: 14 }],
            escalationDays: [{ day: 15 }, { day: 30 }, { day: 45 }],
            rollCallFrequency: 'quarterly',
            passwordUpdateCadenceDays: 180,
          },
        },
      }),
    )
  })
})

describe('selectTenant endpoint', () => {
  it('should require a JSON body', async () => {
    await expect(run(selectTenant, createFakeRequest({ user: superAdmin }))).rejects.toMatchObject({
      code: 400,
    })
  })

  it('should clear the cookie when the tenant is null', async () => {
    const req = createFakeRequest({ user: superAdmin, body: { tenantId: null } })
    const response = await run(selectTenant, req)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ success: true, tenant: null })
    expect(response.headers.get('Set-Cookie')).toContain(`${SELECTED_TENANT_COOKIE_NAME}=;`)
    expect(response.headers.get('Set-Cookie')).toContain('Max-Age=0')
  })

  it('should return 404 when the tenant does not exist', async () => {
    const payload = createFakePayload()
    payload.findByID.mockRejectedValue(new Error('Not Found'))
    const req = createFakeRequest({ user: superAdmin, payload, body: { tenantId: 999 } })
    await expect(run(selectTenant, req)).rejects.toMatchObject({
      message: 'Tenant with ID 999 not found',
      code: 404,
    })
  })

  it('should set the selection cookie for an existing tenant', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildTenant({ id: 10 }))
    const req = createFakeRequest({ user: superAdmin, payload, body: { tenantId: 10 } })
    const response = await run(selectTenant, req)
    const cookie = response.headers.get('Set-Cookie') ?? ''
    expect(cookie).toContain(`${SELECTED_TENANT_COOKIE_NAME}=10`)
    expect(cookie).toContain(`Max-Age=${COOKIE_MAX_AGE_SECONDS}`)
    expect(cookie).toContain('HttpOnly')
    expect(await response.json()).toMatchObject({
      message: 'Switched to tenant: Universidad Andina',
      tenant: { id: 10, domain: 'universidad-andina.edu' },
    })
  })

  it('should mark the cookie as Secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      const payload = createFakePayload()
      payload.findByID.mockResolvedValue(buildTenant())
      const req = createFakeRequest({ user: superAdmin, payload, body: { tenantId: 10 } })
      const response = await run(selectTenant, req)
      expect(response.headers.get('Set-Cookie')).toContain('Secure')
    } finally {
      vi.unstubAllEnvs()
    }
  })
})

describe('getSelectedTenant endpoint', () => {
  const withCookie = (payload = createFakePayload(), cookie?: string) => {
    const req = createFakeRequest({ user: superAdmin, payload })
    if (cookie) req.fake.headers.set('cookie', cookie)
    return req
  }

  it('should report viewing all tenants without a cookie', async () => {
    const response = await run(getSelectedTenant, withCookie())
    expect(await response.json()).toEqual({
      success: true,
      tenant: null,
      isViewingAllTenants: true,
    })
  })

  it('should return the selected tenant', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildTenant({ id: 10 }))
    const response = await run(
      getSelectedTenant,
      withCookie(payload, `${SELECTED_TENANT_COOKIE_NAME}=10`),
    )
    expect(await response.json()).toEqual({
      success: true,
      tenant: { id: 10, name: 'Universidad Andina', domain: 'universidad-andina.edu' },
      isViewingAllTenants: false,
    })
  })

  it('should fall back to all tenants when the tenant lookup fails or returns nothing', async () => {
    const cookie = `${SELECTED_TENANT_COOKIE_NAME}=10`
    const missing = await run(getSelectedTenant, withCookie(createFakePayload(), cookie))
    expect((await missing.json()).isViewingAllTenants).toBe(true)

    const failing = createFakePayload()
    failing.findByID.mockRejectedValue(new Error('gone'))
    const errored = await run(getSelectedTenant, withCookie(failing, cookie))
    expect((await errored.json()).isViewingAllTenants).toBe(true)
  })
})

describe('updateTenant endpoint', () => {
  const updateBody = { ...validTenantBody, name: 'Universidad Andina de Colombia' }

  it('should require a JSON body and an authenticated super admin', async () => {
    await expect(run(updateTenant, createFakeRequest({ user: superAdmin }))).rejects.toMatchObject({
      code: 400,
    })
    await expect(
      run(updateTenant, createFakeRequest({ user: null, body: updateBody })),
    ).rejects.toMatchObject({ code: 401 })
    await expect(
      run(updateTenant, createFakeRequest({ user: centralAdmin, body: updateBody })),
    ).rejects.toMatchObject({ code: 403 })
  })

  it('should reject a non numeric tenant id', async () => {
    const req = createFakeRequest({
      user: superAdmin,
      routeParams: { id: 'abc' },
      body: updateBody,
    })
    await expect(run(updateTenant, req)).rejects.toMatchObject({
      message: 'Invalid tenant ID',
      code: 400,
    })
  })

  it('should return 409 when the new domain belongs to another tenant', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildTenant({ domain: 'otra-universidad.edu' }))
    payload.find.mockResolvedValue({ docs: [buildTenant({ id: 11 })], totalDocs: 1 })
    const req = createFakeRequest({
      user: superAdmin,
      payload,
      routeParams: { id: '10' },
      body: updateBody,
    })
    await expect(run(updateTenant, req)).rejects.toMatchObject({ code: 409 })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should skip the domain check when the domain is unchanged and write an audit log', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildTenant({ domain: 'universidad-andina.edu' }))
    payload.update.mockResolvedValue(buildTenant({ name: 'Universidad Andina de Colombia' }))
    const req = createFakeRequest({
      user: superAdmin,
      payload,
      routeParams: { id: '10' },
      body: updateBody,
    })
    const response = await run(updateTenant, req)
    expect(response.status).toBe(200)
    expect(payload.find).not.toHaveBeenCalled()
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 10,
        data: expect.objectContaining({ name: 'Universidad Andina de Colombia' }),
      }),
    )
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit_log',
        data: expect.objectContaining({ tenant: 10, user: 1 }),
      }),
    )
  })

  it('should allow changing to a free domain', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildTenant({ domain: 'otra-universidad.edu' }))
    const req = createFakeRequest({
      user: superAdmin,
      payload,
      routeParams: { id: '10' },
      body: updateBody,
    })
    const response = await run(updateTenant, req)
    expect(response.status).toBe(200)
    expect(payload.find).toHaveBeenCalledTimes(1)
  })
})
