import { User, Organization } from '@/types/payload-types'
import { rolePermissions, Resource, ResourceAction } from '../constants/rbac'
import { UserRolesEnum } from '@/features/users'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
export class AccessControl {
  private user: User
  private userRoles: UserRolesEnum[]
  private effectiveRole: UserRolesEnum
  private userUnits: Organization[]

  constructor(user: User) {
    this.user = user
    this.userRoles = (user.roles || []) as UserRolesEnum[]
    const effectiveRole = getEffectiveRoleFromUser(user)

    if (!effectiveRole) {
      throw new Error('User must have at least one role')
    }

    this.effectiveRole = effectiveRole
    this.userUnits = user.organizations as Organization[]
  }

  private checkPermission(
    role: UserRolesEnum,
    action: ResourceAction,
    resource: Resource,
    targetUnitId?: number,
  ): boolean {
    const permissions = rolePermissions[role]
    const resourcePermission = permissions.find((p) => p.resource === resource)

    if (!resourcePermission) return false
    if (!resourcePermission.actions.includes(action)) return false

    if (role === UserRolesEnum.SuperAdmin && resource !== 'AUDIT_LOGS') {
      return true
    }

    const { conditions } = resourcePermission
    if (!conditions) return true

    if (conditions.unitOnly && targetUnitId) {
      return this.hasUnitAccess(targetUnitId, conditions.childUnitsIncluded)
    }

    return true
  }

  can(action: ResourceAction, resource: Resource, targetUnitId?: number): boolean {
    return this.checkPermission(this.effectiveRole, action, resource, targetUnitId)
  }

  canWithRole(
    action: ResourceAction,
    resource: Resource,
    role: UserRolesEnum,
    targetUnitId?: number,
  ): boolean {
    return this.checkPermission(role, action, resource, targetUnitId)
  }

  hasRole(role: UserRolesEnum): boolean {
    return this.userRoles.includes(role)
  }

  getEffectiveRole(): UserRolesEnum {
    return this.effectiveRole
  }

  getAllRoles(): UserRolesEnum[] {
    return this.userRoles
  }

  private hasUnitAccess(targetUnitId: number, includeChildren: boolean = false): boolean {
    const userUnitIds = this.userUnits.map((u) => u.id)

    if (userUnitIds.includes(targetUnitId)) {
      return true
    }

    if (includeChildren) {
      const targetUnit = this.userUnits.find((u) => u.id === targetUnitId)
      if (!targetUnit) return false

      // Check if target unit's path includes any of user's units
      return this.userUnits.some((userUnit) => targetUnit.path?.startsWith(userUnit.path || ''))
    }

    return false
  }
}
