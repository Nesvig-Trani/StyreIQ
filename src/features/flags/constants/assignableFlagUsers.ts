import { ASSIGNABLE_USER_ROLES } from '@/features/social-medias/constants/assignable-users'
import { UserRolesEnum } from '@/shared/constants/user-roles'

// Central admins linked to a unit can also own a flag of that unit
export const FLAG_ASSIGNABLE_USER_ROLES = [UserRolesEnum.CentralAdmin, ...ASSIGNABLE_USER_ROLES]
