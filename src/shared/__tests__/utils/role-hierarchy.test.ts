import { describe, expect, it } from 'vitest'
import { UserRolesEnum } from '@/shared/constants/user-roles'
import {
  canAssignRoles,
  canUserPerformAction,
  getEffectiveRole,
  getEffectiveRoleFromUser,
  getHighestRole,
  isSuperAdmin,
  validateRoleCompatibility,
} from '@/shared/utils/role-hierarchy'
import { buildUser } from '../fixtures'

const { SuperAdmin, CentralAdmin, UnitAdmin, SocialMediaManager } = UserRolesEnum

describe('getHighestRole', () => {
  it('should return the role with the highest rank', () => {
    expect(getHighestRole([SocialMediaManager, UnitAdmin])).toBe(UnitAdmin)
    expect(getHighestRole([UnitAdmin, CentralAdmin, SocialMediaManager])).toBe(CentralAdmin)
  })

  it('should throw when the user has no roles', () => {
    expect(() => getHighestRole([])).toThrow('User must have at least one role')
  })
})

describe('getEffectiveRole', () => {
  it('should honour the active role when the user actually holds it', () => {
    expect(getEffectiveRole([UnitAdmin, SocialMediaManager], SocialMediaManager)).toBe(
      SocialMediaManager,
    )
  })

  it('should ignore an active role the user does not hold and fall back to the highest', () => {
    expect(getEffectiveRole([SocialMediaManager], SuperAdmin)).toBe(SocialMediaManager)
  })

  it('should accept a single role', () => {
    expect(getEffectiveRole(CentralAdmin)).toBe(CentralAdmin)
  })

  it('should throw for an empty role list', () => {
    expect(() => getEffectiveRole([])).toThrow('User must have at least one role')
  })
})

describe('getEffectiveRoleFromUser', () => {
  it('should return null when there is no user', () => {
    expect(getEffectiveRoleFromUser(null)).toBeNull()
    expect(getEffectiveRoleFromUser(undefined)).toBeNull()
  })

  it('should return null when the user has an empty roles array', () => {
    expect(getEffectiveRoleFromUser(buildUser({ roles: [] }))).toBeNull()
  })

  it('should use active_role for a user switching between unit admin and manager', () => {
    const user = buildUser({
      roles: ['unit_admin', 'social_media_manager'],
      active_role: 'social_media_manager',
    })
    expect(getEffectiveRoleFromUser(user)).toBe(SocialMediaManager)
  })
})

describe('isSuperAdmin', () => {
  it('should be true only for super admins', () => {
    expect(isSuperAdmin(buildUser({ roles: ['super_admin'] }))).toBe(true)
    expect(isSuperAdmin(buildUser({ roles: ['central_admin'] }))).toBe(false)
    expect(isSuperAdmin(null)).toBe(false)
  })
})

describe('canUserPerformAction', () => {
  it('should allow a central admin to perform unit admin actions', () => {
    expect(canUserPerformAction([CentralAdmin], UnitAdmin)).toBe(true)
  })

  it('should deny a social media manager from performing unit admin actions', () => {
    expect(canUserPerformAction([SocialMediaManager], UnitAdmin)).toBe(false)
  })

  it('should evaluate against the active role, not the highest', () => {
    expect(
      canUserPerformAction([UnitAdmin, SocialMediaManager], UnitAdmin, SocialMediaManager),
    ).toBe(false)
  })
})

describe('canAssignRoles', () => {
  it('should not let a unit admin grant central admin', () => {
    expect(canAssignRoles(UnitAdmin, [CentralAdmin])).toBe(false)
  })

  it('should let a central admin grant lower roles', () => {
    expect(canAssignRoles(CentralAdmin, [UnitAdmin, SocialMediaManager])).toBe(true)
  })
})

describe('validateRoleCompatibility', () => {
  it('should accept a unit admin who is also a social media manager', () => {
    expect(validateRoleCompatibility([UnitAdmin, SocialMediaManager])).toEqual({
      valid: true,
      errors: [],
    })
  })

  it('should reject super admin combined with other roles', () => {
    const result = validateRoleCompatibility([SuperAdmin, UnitAdmin])
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('SuperAdmin cannot be combined with other roles')
  })

  it('should reject duplicated central admin and super admin roles', () => {
    expect(validateRoleCompatibility([CentralAdmin, CentralAdmin]).errors).toContain(
      'Cannot assign CentralAdmin role multiple times',
    )
    expect(validateRoleCompatibility([SuperAdmin, SuperAdmin]).errors).toContain(
      'Cannot assign SuperAdmin role multiple times',
    )
  })
})
