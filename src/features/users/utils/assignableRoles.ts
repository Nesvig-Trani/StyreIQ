import { UserRolesEnum } from '@/features/users/schemas'

export const getAssignableRoles = (role?: UserRolesEnum | null): UserRolesEnum[] => {
  switch (role) {
    case UserRolesEnum.SuperAdmin:
      return Object.values(UserRolesEnum)
    case UserRolesEnum.CentralAdmin:
      return [UserRolesEnum.CentralAdmin, UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager]
    case UserRolesEnum.UnitAdmin:
      return [UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager]
    case UserRolesEnum.SocialMediaManager:
      return [UserRolesEnum.SocialMediaManager]
    default:
      return []
  }
}
