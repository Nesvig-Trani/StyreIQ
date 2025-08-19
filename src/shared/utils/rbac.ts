import { User, Organization } from '@/types/payload-types'
import { rolePermissions, Resource, ResourceAction } from '../constants/rbac'
import { UserRolesEnum } from '@/features/users'

export class AccessControl {
  private user: User
  private userRole: UserRolesEnum
  private userUnits: Organization[]

  constructor(user: User) {
    this.user = user
    this.userRole = user.role as UserRolesEnum
    this.userUnits = user.organizations as Organization[]
  }

  can(action: ResourceAction, resource: Resource, targetUnitId?: number): boolean {
    const permissions = rolePermissions[this.userRole]
    const resourcePermission = permissions.find((p) => p.resource === resource)

    if (!resourcePermission) {
      return false
    }

    if (!resourcePermission.actions.includes(action)) {
      return false
    }

    if (!resourcePermission.conditions) {
      return true
    }

    // Super admin can do anything except audit logs
    if (this.userRole === UserRolesEnum.SuperAdmin && resource !== 'AUDIT_LOGS') {
      return true
    }

    // Check unit-based permissions
    if (resourcePermission.conditions.unitOnly && targetUnitId) {
      const hasAccess = this.hasUnitAccess(
        targetUnitId,
        resourcePermission.conditions.childUnitsIncluded,
      )
      return hasAccess
    }

    return true
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
