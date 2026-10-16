import { describe, expect, it } from 'vitest'
import { JSON_HEADERS, SUPPORT_EMAIL } from '../index'
import { rolePermissions } from '../rbac'
import { UserRolesEnum, UserStatusEnum } from '../user-roles'

describe('shared constants', () => {
  it('should expose JSON headers and a support address', () => {
    expect(JSON_HEADERS).toEqual({ 'Content-Type': 'application/json' })
    expect(SUPPORT_EMAIL).toMatch(/^[^@]+@[^@]+\.[^@]+$/)
  })

  it('should define a status value for every lifecycle state', () => {
    expect(Object.values(UserStatusEnum)).toEqual([
      'active',
      'inactive',
      'pending_activation',
      'rejected',
    ])
  })
})

describe('rolePermissions', () => {
  it('should declare permissions for every role', () => {
    for (const role of Object.values(UserRolesEnum)) {
      expect(rolePermissions[role].length).toBeGreaterThan(0)
    }
  })

  it('should never list a resource twice for the same role', () => {
    for (const permissions of Object.values(rolePermissions)) {
      const resources = permissions.map((permission) => permission.resource)
      expect(new Set(resources).size).toBe(resources.length)
    }
  })

  it('should give super admins full control of tenants and deny it to social media managers', () => {
    const tenants = (role: UserRolesEnum) =>
      rolePermissions[role].find((permission) => permission.resource === 'TENANTS')
    expect(tenants(UserRolesEnum.SuperAdmin)?.actions).toEqual([
      'create',
      'read',
      'update',
      'delete',
    ])
    expect(tenants(UserRolesEnum.SocialMediaManager)).toBeUndefined()
  })

  it('should only grant valid actions', () => {
    const valid = ['create', 'read', 'update', 'delete']
    for (const permissions of Object.values(rolePermissions)) {
      for (const permission of permissions) {
        expect(permission.actions.every((action) => valid.includes(action))).toBe(true)
      }
    }
  })
})
