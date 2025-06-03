import { z } from 'zod'

export enum UserAccessTypeEnum {
  Temporary = 'temporary',
  Permanent = 'permanent',
}

export const userAccessLabelMap: Record<UserAccessTypeEnum, string> = {
  [UserAccessTypeEnum.Permanent]: 'Permanent',
  [UserAccessTypeEnum.Temporary]: 'Temporary',
}

const AccessTypeEnum = z.nativeEnum(UserAccessTypeEnum)

export const organizationAccess = z.object({
  id: z.number(),
  organization: z.number(),
  organization_name: z.string(),
  type: AccessTypeEnum.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})


export const updateOrgAccessSchema = z.object({
  access: z.array(organizationAccess),
})

export type OrgAccess = z.infer<typeof organizationAccess>
