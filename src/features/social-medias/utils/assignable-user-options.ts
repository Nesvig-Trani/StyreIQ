import { UserRolesEnum, UserStatusEnum } from '@/shared/constants/user-roles'
import type { User } from '@/types/payload-types'

export type AssignableUserOption = { value: string; label: string }

const hasRole = (user: User, role: UserRolesEnum) =>
  Array.isArray(user.roles) && (user.roles as string[]).includes(role)

const toOptionLabel = (user: User) =>
  user.status === UserStatusEnum.PendingActivation ? `${user.name} (Pending)` : user.name

export function getAssignableUserOptions(
  users: User[],
  role: UserRolesEnum,
): AssignableUserOption[] {
  return users
    .filter((user) => hasRole(user, role))
    .map((user) => ({ value: user.id.toString(), label: toOptionLabel(user) }))
}
