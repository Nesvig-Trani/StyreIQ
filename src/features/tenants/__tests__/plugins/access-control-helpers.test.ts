import { describe, expect, it } from 'vitest'
import {
  adminOnlyCreateAccess,
  adminOnlyUpdateAccess,
  authenticatedCreateAccess,
  extractTenantId,
  extractTenantIdFromProperty,
  getSelectedTenantFromRequest,
  getTenantIdForAuditLog,
  immutableUpdateAccess,
  managerCreateAccess,
  managerUpdateAccess,
  organizationBasedReadAccess,
  ownerUpdateAccess,
  socialMediaManagerReadAccess,
  superAdminOnlyAccess,
  superAdminOnlyDeleteAccess,
  tenantBasedReadAccess,
  tenantCreateAccess,
  tenantValidatedDeleteAccess,
  tenantValidatedUpdateAccess,
  validateRelatedEntityTenant,
  validateTenantAccess,
} from '@/features/tenants/plugins/collections/helpers/access-control-helpers'
import { SELECTED_TENANT_COOKIE_NAME } from '@/features/tenants/schemas'
import { createFakePayload, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import { buildTenant } from '../tenant-fixtures'

const authUser = (user: ReturnType<typeof buildUser>) => ({ ...user, collection: 'users' as const })

const superAdmin = buildUser({ id: 1, roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({ id: 2, roles: ['central_admin'], tenant: 10 })
const unitAdmin = buildUser({
  id: 3,
  roles: ['unit_admin'],
  tenant: 10,
  organizations: [100],
})
const socialManager = buildUser({
  id: 4,
  roles: ['social_media_manager'],
  tenant: 10,
  organizations: [100],
})

const requestFor = (user: ReturnType<typeof buildUser> | null, payload = createFakePayload()) =>
  createFakeRequest({ user, payload })

describe('extractTenantId', () => {
  it('should read the id from a populated tenant relation', () => {
    expect(extractTenantId(authUser(buildUser({ tenant: buildTenant({ id: 12 }) })))).toBe(12)
  })

  it('should return null when the tenant id is not numeric', () => {
    expect(extractTenantId(authUser(buildUser({ tenant: Number.NaN })))).toBeNull()
  })
})

describe('extractTenantIdFromProperty', () => {
  it('should read the id from a populated tenant object', () => {
    expect(extractTenantIdFromProperty(buildTenant({ id: 33 }))).toBe(33)
  })
})

describe('validateTenantAccess (tenant isolation, GIQ-85)', () => {
  it('should always allow a super admin regardless of the target tenant', () => {
    const { asRequest } = requestFor(superAdmin)
    expect(validateTenantAccess({ req: asRequest(), targetTenantId: 99 })).toEqual({ valid: true })
  })

  it('should return 400 when a non super admin has no tenant assigned', () => {
    const { asRequest } = requestFor(buildUser({ roles: ['central_admin'], tenant: null }))
    const result = validateTenantAccess({ req: asRequest(), targetTenantId: 10 })
    expect(result.valid).toBe(false)
    expect(result.error).toEqual({ message: 'User has no tenant assigned', status: 400 })
  })

  it('should return 403 when the target tenant differs from the user tenant', () => {
    const { asRequest } = requestFor(centralAdmin)
    const result = validateTenantAccess({
      req: asRequest(),
      targetTenantId: '11',
      entityName: 'unit',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toEqual({
      message: 'Cannot access unit from different tenant',
      status: 403,
    })
  })

  it('should allow access and expose the user tenant when tenants match', () => {
    const { asRequest } = requestFor(centralAdmin)
    expect(validateTenantAccess({ req: asRequest(), targetTenantId: '10' })).toEqual({
      valid: true,
      userTenant: 10,
    })
  })

  it('should allow access when no target tenant is given', () => {
    const { asRequest } = requestFor(unitAdmin)
    expect(validateTenantAccess({ req: asRequest() })).toEqual({ valid: true, userTenant: 10 })
  })

  it('should not treat an inactive super_admin role as super admin when active_role is lower', () => {
    const user = buildUser({
      roles: ['super_admin', 'central_admin'],
      active_role: 'central_admin',
      tenant: 10,
    })
    const { asRequest } = requestFor(user)
    expect(validateTenantAccess({ req: asRequest(), targetTenantId: 11 }).valid).toBe(false)
  })
})

describe('validateRelatedEntityTenant (tenant isolation, GIQ-85)', () => {
  it('should return 404 when the related entity does not exist', async () => {
    const { asRequest } = requestFor(centralAdmin)
    const result = await validateRelatedEntityTenant({
      req: asRequest(),
      collection: 'organization',
      entityId: 5,
      entityName: 'Parent organization',
    })
    expect(result.error).toEqual({ message: 'Parent organization not found', status: 404 })
  })

  it('should allow a super admin to use an entity from any tenant', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildOrganization({ id: 5, tenant: 77 }))
    const { asRequest } = requestFor(superAdmin, payload)
    const result = await validateRelatedEntityTenant({
      req: asRequest(),
      collection: 'organization',
      entityId: 5,
    })
    expect(result.valid).toBe(true)
    expect(payload.findByID).toHaveBeenCalledWith({ collection: 'organization', id: 5 })
  })

  it('should return 400 when the entity belongs to a different tenant', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildOrganization({ id: 5, tenant: 77 }))
    const { asRequest } = requestFor(centralAdmin, payload)
    const result = await validateRelatedEntityTenant({
      req: asRequest(),
      collection: 'organization',
      entityId: 5,
      entityName: 'Parent organization',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toEqual({
      message: 'Parent organization belongs to different tenant',
      status: 400,
    })
  })

  it('should compare against a populated tenant relation on the entity', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue({ id: 5, tenant: { id: 10 } })
    const { asRequest } = requestFor(centralAdmin, payload)
    const result = await validateRelatedEntityTenant({
      req: asRequest(),
      collection: 'organization',
      entityId: 5,
    })
    expect(result.valid).toBe(true)
  })

  it('should accept an entity of the same tenant and return it', async () => {
    const payload = createFakePayload()
    const entity = buildOrganization({ id: 5, tenant: 10 })
    payload.findByID.mockResolvedValue(entity)
    const { asRequest } = requestFor(unitAdmin, payload)
    const result = await validateRelatedEntityTenant({
      req: asRequest(),
      collection: 'organization',
      entityId: 5,
    })
    expect(result).toEqual({ valid: true, entity })
  })

  it('should accept an entity that has no tenant field', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue({ id: 8 })
    const { asRequest } = requestFor(unitAdmin, payload)
    const result = await validateRelatedEntityTenant({
      req: asRequest(),
      collection: 'users',
      entityId: 8,
    })
    expect(result.valid).toBe(true)
  })
})

describe('read access', () => {
  it.each([
    ['tenantBasedReadAccess', tenantBasedReadAccess],
    ['organizationBasedReadAccess', organizationBasedReadAccess],
    ['socialMediaManagerReadAccess', socialMediaManagerReadAccess],
  ])('%s should deny anonymous requests', async (_name, access) => {
    expect(await access({ req: requestFor(null).asRequest() })).toBe(false)
  })

  it.each([
    ['tenantBasedReadAccess', tenantBasedReadAccess],
    ['organizationBasedReadAccess', organizationBasedReadAccess],
    ['socialMediaManagerReadAccess', socialMediaManagerReadAccess],
  ])('%s should give super admins unrestricted access', async (_name, access) => {
    expect(await access({ req: requestFor(superAdmin).asRequest() })).toBe(true)
  })

  it.each([
    ['tenantBasedReadAccess', tenantBasedReadAccess],
    ['organizationBasedReadAccess', organizationBasedReadAccess],
    ['socialMediaManagerReadAccess', socialMediaManagerReadAccess],
  ])('%s should deny users without a tenant', async (_name, access) => {
    const user = buildUser({ roles: ['central_admin'], tenant: null })
    expect(await access({ req: requestFor(user).asRequest() })).toBe(false)
  })

  it('tenantBasedReadAccess should scope every other role to its tenant', async () => {
    for (const user of [centralAdmin, unitAdmin, socialManager]) {
      expect(await tenantBasedReadAccess({ req: requestFor(user).asRequest() })).toEqual({
        tenant: { equals: 10 },
      })
    }
  })

  it('organizationBasedReadAccess should scope central admins to their tenant', async () => {
    expect(
      await organizationBasedReadAccess({ req: requestFor(centralAdmin).asRequest() }),
    ).toEqual({ tenant: { equals: 10 } })
  })

  it('organizationBasedReadAccess should limit unit admins to their accessible organizations', async () => {
    const payload = createFakePayload()
    payload.find.mockResolvedValueOnce({ docs: [{ id: 101 }, { id: 102 }] })
    payload.find.mockResolvedValueOnce({ docs: [{ id: 103 }] })
    payload.find.mockResolvedValueOnce({ docs: [] })
    const result = await organizationBasedReadAccess({
      req: requestFor(unitAdmin, payload).asRequest(),
    })
    expect(result).toEqual({
      and: [{ tenant: { equals: 10 } }, { organizations: { in: [100, 101, 102, 103] } }],
    })
  })

  it('organizationBasedReadAccess should deny social media managers', async () => {
    expect(await organizationBasedReadAccess({ req: requestFor(socialManager).asRequest() })).toBe(
      false,
    )
  })

  it('socialMediaManagerReadAccess should scope central admins to their tenant', async () => {
    expect(
      await socialMediaManagerReadAccess({ req: requestFor(centralAdmin).asRequest() }),
    ).toEqual({ tenant: { equals: 10 } })
  })

  it('socialMediaManagerReadAccess should limit unit admins to their accessible organizations', async () => {
    const payload = createFakePayload()
    const result = await socialMediaManagerReadAccess({
      req: requestFor(unitAdmin, payload).asRequest(),
    })
    expect(result).toEqual({
      and: [{ tenant: { equals: 10 } }, { organizations: { in: [100] } }],
    })
  })

  it('socialMediaManagerReadAccess should limit managers to their own organizations', async () => {
    const result = await socialMediaManagerReadAccess({
      req: requestFor(socialManager).asRequest(),
    })
    expect(result).toEqual({
      and: [{ tenant: { equals: 10 } }, { organizations: { in: [100] } }],
    })
  })

  it('socialMediaManagerReadAccess should deny managers without organizations', async () => {
    const user = buildUser({ roles: ['social_media_manager'], tenant: 10, organizations: [] })
    expect(await socialMediaManagerReadAccess({ req: requestFor(user).asRequest() })).toBe(false)
  })
})

describe('create access', () => {
  const cookieRequest = (
    user: ReturnType<typeof buildUser>,
    cookie: string,
  ): ReturnType<typeof createFakeRequest> => {
    const request = requestFor(user)
    request.fake.headers.set('cookie', cookie)
    return request
  }

  it('adminOnlyCreateAccess should deny anonymous and lower roles', async () => {
    expect(await adminOnlyCreateAccess({ req: requestFor(null).asRequest() })).toBe(false)
    expect(await adminOnlyCreateAccess({ req: requestFor(unitAdmin).asRequest() })).toBe(false)
    expect(await adminOnlyCreateAccess({ req: requestFor(socialManager).asRequest() })).toBe(false)
  })

  it('adminOnlyCreateAccess should require a super admin to pick a tenant', async () => {
    expect(await adminOnlyCreateAccess({ req: requestFor(superAdmin).asRequest() })).toBe(false)
    const withCookie = cookieRequest(superAdmin, `${SELECTED_TENANT_COOKIE_NAME}=10`)
    expect(await adminOnlyCreateAccess({ req: withCookie.asRequest() })).toBe(true)
    expect(
      await adminOnlyCreateAccess({
        req: requestFor(superAdmin).asRequest(),
        data: { tenant: 10 },
      }),
    ).toBe(true)
  })

  it('adminOnlyCreateAccess should block central admins from creating in another tenant', async () => {
    const req = requestFor(centralAdmin).asRequest()
    expect(await adminOnlyCreateAccess({ req, data: { tenant: 11 } })).toBe(false)
    expect(await adminOnlyCreateAccess({ req, data: { tenant: 10 } })).toBe(true)
    expect(await adminOnlyCreateAccess({ req, data: {} })).toBe(true)
  })

  it('adminOnlyCreateAccess should deny central admins without a tenant', async () => {
    const user = buildUser({ roles: ['central_admin'], tenant: null })
    expect(await adminOnlyCreateAccess({ req: requestFor(user).asRequest() })).toBe(false)
  })

  it('managerCreateAccess should allow admins and deny managers or anonymous users', async () => {
    expect(await managerCreateAccess({ req: requestFor(null).asRequest() })).toBe(false)
    expect(await managerCreateAccess({ req: requestFor(centralAdmin).asRequest() })).toBe(true)
    expect(await managerCreateAccess({ req: requestFor(unitAdmin).asRequest() })).toBe(true)
    expect(await managerCreateAccess({ req: requestFor(socialManager).asRequest() })).toBe(false)
  })

  it('managerCreateAccess should require a tenant for super admins', async () => {
    expect(await managerCreateAccess({ req: requestFor(superAdmin).asRequest() })).toBe(false)
    expect(
      await managerCreateAccess({ req: requestFor(superAdmin).asRequest(), data: { tenant: 10 } }),
    ).toBe(true)
  })

  it('tenantCreateAccess should deny anonymous users', () => {
    expect(tenantCreateAccess({ req: requestFor(null).asRequest() })).toBe(false)
  })

  it('tenantCreateAccess should require a tenant for super admins', () => {
    expect(tenantCreateAccess({ req: requestFor(superAdmin).asRequest() })).toBe(false)
    expect(
      tenantCreateAccess({ req: requestFor(superAdmin).asRequest(), data: { tenant: { id: 4 } } }),
    ).toBe(true)
  })

  it('tenantCreateAccess should reject data for another tenant', () => {
    const req = requestFor(socialManager).asRequest()
    expect(tenantCreateAccess({ req, data: { tenant: 11 } })).toBe(false)
    expect(tenantCreateAccess({ req, data: { tenant: 10 } })).toBe(true)
    expect(tenantCreateAccess({ req })).toBe(true)
  })

  it('tenantCreateAccess should deny users without a tenant', () => {
    const user = buildUser({ roles: ['unit_admin'], tenant: null })
    expect(tenantCreateAccess({ req: requestFor(user).asRequest() })).toBe(false)
  })

  it('authenticatedCreateAccess should only require a logged in user', async () => {
    expect(await authenticatedCreateAccess({ req: requestFor(null).asRequest() })).toBe(false)
    expect(await authenticatedCreateAccess({ req: requestFor(socialManager).asRequest() })).toBe(
      true,
    )
  })
})

describe('update access', () => {
  it('adminOnlyUpdateAccess should allow only super and central admins', async () => {
    expect(await adminOnlyUpdateAccess({ req: requestFor(null).asRequest() })).toBe(false)
    expect(await adminOnlyUpdateAccess({ req: requestFor(superAdmin).asRequest() })).toBe(true)
    expect(await adminOnlyUpdateAccess({ req: requestFor(centralAdmin).asRequest() })).toBe(true)
    expect(await adminOnlyUpdateAccess({ req: requestFor(unitAdmin).asRequest() })).toBe(false)
  })

  it('managerUpdateAccess should allow admins but not social media managers', async () => {
    expect(await managerUpdateAccess({ req: requestFor(null).asRequest() })).toBe(false)
    expect(await managerUpdateAccess({ req: requestFor(superAdmin).asRequest() })).toBe(true)
    expect(await managerUpdateAccess({ req: requestFor(unitAdmin).asRequest() })).toBe(true)
    expect(await managerUpdateAccess({ req: requestFor(socialManager).asRequest() })).toBe(false)
  })

  it('immutableUpdateAccess should always deny', async () => {
    expect(await immutableUpdateAccess({ req: requestFor(superAdmin).asRequest() })).toBe(false)
  })

  describe('tenantValidatedUpdateAccess', () => {
    const access = tenantValidatedUpdateAccess('organization')

    it('should deny when there is no user or no string id', async () => {
      expect(await access({ req: requestFor(null).asRequest(), id: '5' })).toBe(false)
      expect(await access({ req: requestFor(centralAdmin).asRequest() })).toBe(false)
      expect(await access({ req: requestFor(centralAdmin).asRequest(), id: 5 })).toBe(false)
    })

    it('should allow super admins without touching the database', async () => {
      const payload = createFakePayload()
      expect(await access({ req: requestFor(superAdmin, payload).asRequest(), id: '5' })).toBe(true)
      expect(payload.findByID).not.toHaveBeenCalled()
    })

    it('should deny users without a tenant', async () => {
      const user = buildUser({ roles: ['central_admin'], tenant: null })
      expect(await access({ req: requestFor(user).asRequest(), id: '5' })).toBe(false)
    })

    it('should deny when the target document does not exist', async () => {
      expect(await access({ req: requestFor(centralAdmin).asRequest(), id: '5' })).toBe(false)
    })

    it('should deny central admins editing a document of another tenant', async () => {
      const payload = createFakePayload()
      payload.findByID.mockResolvedValue(buildOrganization({ id: 5, tenant: 11 }))
      expect(await access({ req: requestFor(centralAdmin, payload).asRequest(), id: '5' })).toBe(
        false,
      )
    })

    it('should deny moving a document to another tenant', async () => {
      const payload = createFakePayload()
      payload.findByID.mockResolvedValue(buildOrganization({ id: 5, tenant: 10 }))
      const req = requestFor(centralAdmin, payload).asRequest()
      expect(await access({ req, id: '5', data: { tenant: 11 } })).toBe(false)
    })

    it('should allow central admins to edit documents of their tenant', async () => {
      const payload = createFakePayload()
      payload.findByID.mockResolvedValue(buildOrganization({ id: 5, tenant: 10 }))
      expect(await access({ req: requestFor(centralAdmin, payload).asRequest(), id: '5' })).toBe(
        true,
      )
    })

    it('should deny unit admins even inside their own tenant', async () => {
      const payload = createFakePayload()
      payload.findByID.mockResolvedValue(buildOrganization({ id: 5, tenant: 10 }))
      expect(await access({ req: requestFor(unitAdmin, payload).asRequest(), id: '5' })).toBe(false)
    })

    it('should deny when the lookup throws', async () => {
      const payload = createFakePayload()
      payload.findByID.mockRejectedValue(new Error('connection lost'))
      expect(await access({ req: requestFor(centralAdmin, payload).asRequest(), id: '5' })).toBe(
        false,
      )
    })
  })

  describe('ownerUpdateAccess', () => {
    const access = ownerUpdateAccess('flags')

    it('should deny anonymous users and non string ids', async () => {
      expect(await access({ req: requestFor(null).asRequest(), id: '3' })).toBe(false)
      expect(await access({ req: requestFor(socialManager).asRequest() })).toBe(false)
    })

    it('should allow super admins', async () => {
      expect(await access({ req: requestFor(superAdmin).asRequest(), id: '3' })).toBe(true)
    })

    it('should allow the owner of the document only', async () => {
      const payload = createFakePayload()
      payload.findByID.mockResolvedValue({ id: 3, user: 4 })
      expect(await access({ req: requestFor(socialManager, payload).asRequest(), id: '3' })).toBe(
        true,
      )
      expect(await access({ req: requestFor(unitAdmin, payload).asRequest(), id: '3' })).toBe(false)
    })

    it('should deny when the lookup throws', async () => {
      const payload = createFakePayload()
      payload.findByID.mockRejectedValue(new Error('not found'))
      expect(await access({ req: requestFor(socialManager, payload).asRequest(), id: '3' })).toBe(
        false,
      )
    })
  })
})

describe('delete access', () => {
  it('superAdminOnlyAccess should allow only super admins', () => {
    expect(superAdminOnlyAccess({ req: requestFor(superAdmin).asRequest() })).toBe(true)
    expect(superAdminOnlyAccess({ req: requestFor(centralAdmin).asRequest() })).toBe(false)
    expect(superAdminOnlyAccess({ req: requestFor(null).asRequest() })).toBe(false)
  })

  it('superAdminOnlyDeleteAccess should allow only super admins', async () => {
    expect(await superAdminOnlyDeleteAccess({ req: requestFor(null).asRequest() })).toBe(false)
    expect(await superAdminOnlyDeleteAccess({ req: requestFor(centralAdmin).asRequest() })).toBe(
      false,
    )
    expect(await superAdminOnlyDeleteAccess({ req: requestFor(superAdmin).asRequest() })).toBe(true)
  })

  describe('tenantValidatedDeleteAccess', () => {
    const access = tenantValidatedDeleteAccess('organization')

    it('should deny anonymous users and missing ids', async () => {
      expect(await access({ req: requestFor(null).asRequest(), id: '5' })).toBe(false)
      expect(await access({ req: requestFor(centralAdmin).asRequest() })).toBe(false)
    })

    it('should allow super admins and deny users without tenant', async () => {
      expect(await access({ req: requestFor(superAdmin).asRequest(), id: '5' })).toBe(true)
      const user = buildUser({ roles: ['central_admin'], tenant: null })
      expect(await access({ req: requestFor(user).asRequest(), id: '5' })).toBe(false)
    })

    it('should deny when the target is missing or from another tenant', async () => {
      const payload = createFakePayload()
      expect(await access({ req: requestFor(centralAdmin, payload).asRequest(), id: '5' })).toBe(
        false,
      )
      payload.findByID.mockResolvedValue(buildOrganization({ id: 5, tenant: 11 }))
      expect(await access({ req: requestFor(centralAdmin, payload).asRequest(), id: '5' })).toBe(
        false,
      )
    })

    it('should allow central admins deleting inside their tenant but not unit admins', async () => {
      const payload = createFakePayload()
      payload.findByID.mockResolvedValue(buildOrganization({ id: 5, tenant: 10 }))
      expect(await access({ req: requestFor(centralAdmin, payload).asRequest(), id: '5' })).toBe(
        true,
      )
      expect(await access({ req: requestFor(unitAdmin, payload).asRequest(), id: '5' })).toBe(false)
    })

    it('should deny when the lookup throws', async () => {
      const payload = createFakePayload()
      payload.findByID.mockRejectedValue(new Error('timeout'))
      expect(await access({ req: requestFor(centralAdmin, payload).asRequest(), id: '5' })).toBe(
        false,
      )
    })
  })
})

describe('getSelectedTenantFromRequest', () => {
  const withCookie = (cookie?: string) => {
    const { fake, asRequest } = requestFor(superAdmin)
    if (cookie !== undefined) fake.headers.set('cookie', cookie)
    return asRequest()
  }

  it('should return null without cookies', () => {
    expect(getSelectedTenantFromRequest(withCookie())).toBeNull()
  })

  it('should return the tenant id stored in the selection cookie', () => {
    expect(
      getSelectedTenantFromRequest(withCookie(`theme=dark; ${SELECTED_TENANT_COOKIE_NAME}=25`)),
    ).toBe(25)
  })

  it('should return null for a non numeric cookie value or other cookies', () => {
    expect(
      getSelectedTenantFromRequest(withCookie(`${SELECTED_TENANT_COOKIE_NAME}=abc`)),
    ).toBeNull()
    expect(getSelectedTenantFromRequest(withCookie('theme=dark'))).toBeNull()
  })
})

describe('getTenantIdForAuditLog', () => {
  it('should return null without a user', () => {
    expect(getTenantIdForAuditLog(requestFor(null).asRequest(), {})).toBeNull()
  })

  it('should prefer the tenant on the document, populated or not', () => {
    const req = requestFor(centralAdmin).asRequest()
    expect(getTenantIdForAuditLog(req, { tenant: 14 })).toBe(14)
    expect(getTenantIdForAuditLog(req, { tenant: { id: 15 } })).toBe(15)
  })

  it('should fall back to the selected tenant cookie for super admins', () => {
    const { fake, asRequest } = requestFor(superAdmin)
    fake.headers.set('cookie', `${SELECTED_TENANT_COOKIE_NAME}=21`)
    expect(getTenantIdForAuditLog(asRequest(), {})).toBe(21)
  })

  it('should fall back to the user tenant for other roles', () => {
    expect(getTenantIdForAuditLog(requestFor(unitAdmin).asRequest(), {})).toBe(10)
  })
})
