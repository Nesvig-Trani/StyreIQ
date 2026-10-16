import { describe, expect, it } from 'vitest'
import { UserRolesEnum } from '@/shared/constants/user-roles'
import { AccessControl } from '@/shared/utils/rbac'
import { buildOrganization, buildUser } from '../fixtures'

const comunicaciones = buildOrganization({
  id: 100,
  name: 'Dirección de Comunicaciones',
  path: '/100',
})
const facultadArtes = buildOrganization({
  id: 101,
  name: 'Facultad de Artes',
  path: '/100/101',
  depth: 1,
})
const biblioteca = buildOrganization({ id: 200, name: 'Biblioteca Central', path: '/200' })

describe('AccessControl', () => {
  it('should refuse to build for a user without roles', () => {
    expect(() => new AccessControl(buildUser({ roles: [] }))).toThrow(
      'User must have at least one role',
    )
  })

  it('should let a super admin act on any unit regardless of unit membership', () => {
    const ac = new AccessControl(buildUser({ roles: ['super_admin'], organizations: [] }))
    expect(ac.can('delete', 'UNITS', biblioteca.id)).toBe(true)
    expect(ac.can('create', 'TENANTS')).toBe(true)
  })

  it('should deny actions a role is never granted', () => {
    const ac = new AccessControl(
      buildUser({ roles: ['social_media_manager'], organizations: [comunicaciones] }),
    )
    expect(ac.can('delete', 'TENANTS')).toBe(false)
  })

  it('should restrict a unit admin to their own units', () => {
    const ac = new AccessControl(
      buildUser({ roles: ['unit_admin'], organizations: [comunicaciones] }),
    )
    expect(ac.can('read', 'SOCIAL_MEDIAS', comunicaciones.id)).toBe(true)
    expect(ac.can('read', 'SOCIAL_MEDIAS', biblioteca.id)).toBe(false)
  })

  it('should evaluate permissions against the active role', () => {
    const user = buildUser({
      roles: ['unit_admin', 'social_media_manager'],
      active_role: 'social_media_manager',
      organizations: [comunicaciones, facultadArtes],
    })
    const ac = new AccessControl(user)
    expect(ac.getEffectiveRole()).toBe(UserRolesEnum.SocialMediaManager)
    expect(ac.getAllRoles()).toEqual(['unit_admin', 'social_media_manager'])
    expect(ac.hasRole(UserRolesEnum.UnitAdmin)).toBe(true)
    expect(ac.hasRole(UserRolesEnum.CentralAdmin)).toBe(false)
  })

  it('should compare permissions of another role with canWithRole', () => {
    const ac = new AccessControl(
      buildUser({ roles: ['unit_admin'], organizations: [comunicaciones] }),
    )
    expect(ac.canWithRole('delete', 'TENANTS', UserRolesEnum.SuperAdmin)).toBe(true)
    expect(ac.canWithRole('delete', 'TENANTS', UserRolesEnum.UnitAdmin)).toBe(false)
  })
})
