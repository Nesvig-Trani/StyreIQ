import { UserRolesEnum } from '@/features/users'

export type Resource =
  | 'USERS'
  | 'UNITS'
  | 'SOCIAL_MEDIAS'
  | 'FLAGS'
  | 'POLICIES'
  | 'REVIEW_REQUESTS'
  | 'AUDIT_LOGS'

export type ResourceAction = 'create' | 'read' | 'update' | 'delete'

export type Permission = {
  resource: Resource
  actions: ResourceAction[]
  conditions?: {
    ownerOnly?: boolean
    unitOnly?: boolean
    childUnitsIncluded?: boolean
  }
}

export const rolePermissions: Record<UserRolesEnum, Permission[]> = {
  [UserRolesEnum.SuperAdmin]: [
    {
      resource: 'UNITS',
      actions: ['create', 'read', 'update', 'delete'],
      conditions: {
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'USERS',
      actions: ['create', 'read', 'update', 'delete'],
      conditions: {
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'SOCIAL_MEDIAS',
      actions: ['create', 'read', 'update', 'delete'],
      conditions: {
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'FLAGS',
      actions: ['create', 'read', 'update', 'delete'],
      conditions: {
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'POLICIES',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'REVIEW_REQUESTS',
      actions: ['read', 'update'],
    },
    {
      resource: 'AUDIT_LOGS',
      actions: ['read'],
    },
  ],
  [UserRolesEnum.UnitAdmin]: [
    {
      resource: 'UNITS',
      actions: ['read', 'update'],
      conditions: {
        unitOnly: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'USERS',
      actions: ['create', 'read', 'update'],
      conditions: {
        unitOnly: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'SOCIAL_MEDIAS',
      actions: ['create', 'read', 'update'],
      conditions: {
        unitOnly: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'FLAGS',
      actions: ['create', 'read', 'update'],
      conditions: {
        unitOnly: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'AUDIT_LOGS',
      actions: ['read'],
      conditions: {
        unitOnly: true,
        childUnitsIncluded: true,
      },
    },
  ],
  [UserRolesEnum.SocialMediaManager]: [
    {
      resource: 'UNITS',
      actions: ['read'],
      conditions: {
        unitOnly: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'SOCIAL_MEDIAS',
      actions: ['read'],
      conditions: {
        unitOnly: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'FLAGS',
      actions: ['read'],
      conditions: {
        unitOnly: true,
        childUnitsIncluded: true,
      },
    },
  ],
}
