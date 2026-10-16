// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Unit } from '@/features/units/plugins/collections/unit.collection'
import {
  createFakeCollection,
  createFakePayload,
  createFakeRequest,
} from '@/shared/__tests__/payload-fakes'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const getPayloadContext = vi.hoisted(() => vi.fn())

vi.mock('@/shared/utils/getPayloadContext', () => ({ getPayloadContext }))

const superAdmin = buildUser({ id: 1, roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({ id: 2, roles: ['central_admin'], tenant: 10 })
const unitAdmin = buildUser({
  id: 3,
  name: 'Andrés Cárdenas',
  roles: ['unit_admin'],
  tenant: 10,
  organizations: [100],
})

describe('Unit beforeChange hook', () => {
  const hook = Unit.hooks?.beforeChange?.[0]
  const collection = createFakeCollection('organization')
  let payload: ReturnType<typeof createFakePayload>

  beforeEach(() => {
    payload = createFakePayload()
    getPayloadContext.mockResolvedValue({ payload: payload.asPayload() })
    // Unit admin owns "Dirección de Comunicaciones" (100) and its child (101).
    payload.find.mockImplementation(async ({ where }: { where?: Record<string, unknown> }) => {
      const isChildrenOfOwnedUnit =
        JSON.stringify(where) === JSON.stringify({ parentOrg: { in: [100] } })
      return isChildrenOfOwnedUnit
        ? { docs: [buildOrganization({ id: 101, parentOrg: 100 })], totalDocs: 1 }
        : { docs: [], totalDocs: 0 }
    })
  })

  const run = ({
    user,
    operation,
    data,
    originalDoc,
  }: {
    user: ReturnType<typeof buildUser> | null
    operation: 'create' | 'update'
    data: Record<string, unknown>
    originalDoc?: ReturnType<typeof buildOrganization>
  }) =>
    hook?.({
      collection,
      context: {},
      data,
      operation,
      originalDoc,
      req: createFakeRequest({ user, payload }).asRequest(),
    })

  describe('creating units as Unit Admin', () => {
    it('should reject creating a main unit without parent organization', async () => {
      await expect(
        run({ user: unitAdmin, operation: 'create', data: { name: 'Facultad de Artes' } }),
      ).rejects.toThrow('Unit Admins cannot create main units. A parent organization is required.')
    })

    it('should reject a parent outside the accessible hierarchy', async () => {
      await expect(
        run({ user: unitAdmin, operation: 'create', data: { name: 'Biblioteca', parentOrg: 555 } }),
      ).rejects.toThrow('You do not have access to the specified parent organization.')
    })

    it('should allow a sub-unit under an owned unit given as id', async () => {
      await expect(
        run({ user: unitAdmin, operation: 'create', data: { name: 'Radio', parentOrg: 100 } }),
      ).resolves.toBeUndefined()
    })

    it('should allow a sub-unit under a descendant given as populated object', async () => {
      await expect(
        run({
          user: unitAdmin,
          operation: 'create',
          data: { name: 'Podcast', parentOrg: buildOrganization({ id: 101 }) },
        }),
      ).resolves.toBeUndefined()
    })
  })

  describe('updating units as Unit Admin', () => {
    it('should reject editing a main unit', async () => {
      await expect(
        run({
          user: unitAdmin,
          operation: 'update',
          data: { name: 'Comunicaciones' },
          originalDoc: buildOrganization({ id: 100, parentOrg: null }),
        }),
      ).rejects.toThrow('Unit Admins cannot edit main units. Only sub-units can be modified.')
    })

    it('should reject removing the parent organization of a sub-unit', async () => {
      await expect(
        run({
          user: unitAdmin,
          operation: 'update',
          data: { parentOrg: null },
          originalDoc: buildOrganization({ id: 101, parentOrg: 100 }),
        }),
      ).rejects.toThrow('Unit Admins cannot remove parent organization.')
    })

    it('should allow renaming a sub-unit', async () => {
      await expect(
        run({
          user: unitAdmin,
          operation: 'update',
          data: { name: 'Radio Universitaria' },
          originalDoc: buildOrganization({ id: 101, parentOrg: 100 }),
        }),
      ).resolves.toBeUndefined()
    })
  })

  describe('primary unit status', () => {
    const originalDoc = buildOrganization({ id: 100, isPrimaryUnit: false })

    it('should reject changing the primary unit flag for non super admins', async () => {
      await expect(
        run({
          user: centralAdmin,
          operation: 'update',
          data: { isPrimaryUnit: true },
          originalDoc,
        }),
      ).rejects.toThrow('Only SuperAdmin can modify Primary Unit status.')
    })

    it('should allow a super admin to change the primary unit flag', async () => {
      await expect(
        run({ user: superAdmin, operation: 'update', data: { isPrimaryUnit: true }, originalDoc }),
      ).resolves.toBeUndefined()
    })

    it('should allow non super admins to resend the unchanged flag', async () => {
      await expect(
        run({
          user: centralAdmin,
          operation: 'update',
          data: { isPrimaryUnit: false },
          originalDoc,
        }),
      ).resolves.toBeUndefined()
    })

    it('should ignore the flag check on create', async () => {
      await expect(
        run({
          user: centralAdmin,
          operation: 'create',
          data: { name: 'Vicerrectoría', isPrimaryUnit: true },
        }),
      ).resolves.toBeUndefined()
    })
  })

  it('should not restrict central admins from creating or editing main units', async () => {
    await expect(
      run({ user: centralAdmin, operation: 'create', data: { name: 'Facultad de Ingeniería' } }),
    ).resolves.toBeUndefined()
    await expect(
      run({
        user: centralAdmin,
        operation: 'update',
        data: { name: 'Facultad de Ingeniería y Ciencias' },
        originalDoc: buildOrganization({ id: 100, parentOrg: null }),
      }),
    ).resolves.toBeUndefined()
  })
})
