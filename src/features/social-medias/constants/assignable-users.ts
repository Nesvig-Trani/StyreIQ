import { UserRolesEnum, UserStatusEnum } from '@/shared/constants/user-roles'

export const ASSIGNABLE_USER_ROLES = [
  UserRolesEnum.SuperAdmin,
  UserRolesEnum.UnitAdmin,
  UserRolesEnum.SocialMediaManager,
]

export const ASSIGNABLE_USER_STATUSES = [UserStatusEnum.Active, UserStatusEnum.PendingActivation]
