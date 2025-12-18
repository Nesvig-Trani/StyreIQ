import { UserRolesEnum } from '@/features/users/schemas'
import type { User } from '@/types/payload-types'

export const ROLE_HIERARCHY = {
  [UserRolesEnum.SuperAdmin]: 4,
  [UserRolesEnum.CentralAdmin]: 3,
  [UserRolesEnum.UnitAdmin]: 2,
  [UserRolesEnum.SocialMediaManager]: 1,
}

export const normalizeRoles = (roles: User['roles'] | undefined): UserRolesEnum[] => {
  if (!roles || !Array.isArray(roles)) return []
  return roles as UserRolesEnum[]
}

export const normalizeActiveRole = (
  activeRole: User['active_role'] | undefined,
): UserRolesEnum | undefined => {
  if (!activeRole) return undefined
  return activeRole as UserRolesEnum
}

export const getHighestRole = (roles: UserRolesEnum[]): UserRolesEnum => {
  if (!roles || roles.length === 0) {
    throw new Error('User must have at least one role')
  }

  return roles.reduce((highest, current) =>
    ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest] ? current : highest,
  )
}

export const getEffectiveRole = (
  roles: UserRolesEnum | UserRolesEnum[],
  activeRole?: UserRolesEnum,
): UserRolesEnum => {
  const rolesArray = Array.isArray(roles) ? roles : [roles]

  if (rolesArray.length === 0) {
    throw new Error('User must have at least one role')
  }

  if (activeRole && rolesArray.includes(activeRole)) {
    return activeRole
  }

  return getHighestRole(rolesArray)
}

export const getEffectiveRoleFromUser = (user?: User | null): UserRolesEnum | null => {
  if (!user) return null

  const roles = normalizeRoles(user.roles)
  const activeRole = normalizeActiveRole(user.active_role)

  if (roles.length === 0) return null

  return getEffectiveRole(roles, activeRole)
}

export const canUserPerformAction = (
  userRoles: UserRolesEnum[],
  requiredRole: UserRolesEnum,
  activeRole?: UserRolesEnum,
): boolean => {
  const roleToCheck = getEffectiveRole(userRoles, activeRole)
  return ROLE_HIERARCHY[roleToCheck] >= ROLE_HIERARCHY[requiredRole]
}

export const validateRoleCompatibility = (
  roles: UserRolesEnum[],
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  const superAdminCount = roles.filter((r) => r === UserRolesEnum.SuperAdmin).length
  if (superAdminCount > 1) {
    errors.push('Cannot assign SuperAdmin role multiple times')
  }

  if (superAdminCount > 0 && roles.length > 1) {
    errors.push('SuperAdmin cannot be combined with other roles')
  }

  const centralAdminCount = roles.filter((r) => r === UserRolesEnum.CentralAdmin).length
  if (centralAdminCount > 1) {
    errors.push('Cannot assign CentralAdmin role multiple times')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
