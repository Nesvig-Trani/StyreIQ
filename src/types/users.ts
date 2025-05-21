export enum UserRolesEnum {
  SuperAdmin = 'super_admin',
  UnitAdmin = 'unit_admin',
  SocialMediaManager = 'social_media_manager',
}

export enum UserStatusEnum {
  Active = 'active',
  PendingActivation = 'pending_activation',
}

export const roleLabelMap: Record<UserRolesEnum, string> = {
  [UserRolesEnum.SuperAdmin]: 'Super Admin',
  [UserRolesEnum.UnitAdmin]: 'Unit Admin',
  [UserRolesEnum.SocialMediaManager]: 'Social Media Manager',
}

export const statusLabelMap: Record<UserStatusEnum, string> = {
  [UserStatusEnum.Active]: 'Active',
  [UserStatusEnum.PendingActivation]: 'Pending Activation',
}
