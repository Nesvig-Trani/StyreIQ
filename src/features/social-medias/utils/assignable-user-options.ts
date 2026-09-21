import { UserRolesEnum, UserStatusEnum } from '@/shared/constants/user-roles'
import type { User } from '@/types/payload-types'

export type AssignableUserOption = { value: string; label: string }

const belongsToOrganization = (user: User, organizationId: number) =>
  Array.isArray(user.organizations) &&
  user.organizations.some((org) =>
    typeof org === 'number' ? org === organizationId : org?.id === organizationId,
  )

const hasRole = (user: User, role: UserRolesEnum) =>
  Array.isArray(user.roles) && (user.roles as string[]).includes(role)

const toOptionLabel = (user: User) =>
  user.status === UserStatusEnum.PendingActivation ? `${user.name} (Pending)` : user.name

export function getAssignableUserOptions(
  users: User[],
  organizationId: string | null,
  role: UserRolesEnum,
): AssignableUserOption[] {
  if (!organizationId) return []

  const numericOrgId = Number(organizationId)

  return users
    .filter((user) => hasRole(user, role) && belongsToOrganization(user, numericOrgId))
    .map((user) => ({ value: user.id.toString(), label: toOptionLabel(user) }))
}
