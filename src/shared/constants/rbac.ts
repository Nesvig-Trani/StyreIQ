import { UserRolesEnum } from './user-roles'

export type Resource =
  | 'USERS'
  | 'UNITS'
  | 'SOCIAL_MEDIAS'
  | 'FLAGS'
  | 'POLICIES'
  | 'REVIEW_REQUESTS'
  | 'AUDIT_LOGS'
  | 'DASHBOARD'

export type ResourceAction = 'create' | 'read' | 'update' | 'delete'

export type Permission = {
  resource: Resource
  actions: ResourceAction[]
  conditions?: {
    ownerOnly?: boolean
    unitOnly?: boolean
    childUnitsIncluded?: boolean
    tenantScoped?: boolean
  }
}

export const rolePermissions: Record<UserRolesEnum, Permission[]> = {
  [UserRolesEnum.SuperAdmin]: [
    {
      resource: 'DASHBOARD',
      actions: ['create', 'read', 'update', 'delete'],
      conditions: {
        childUnitsIncluded: true,
        tenantScoped: false,
      },
    },
    {
      resource: 'UNITS',
      actions: ['create', 'read', 'update', 'delete'],
      conditions: {
        childUnitsIncluded: true,
        tenantScoped: false,
      },
    },
    {
      resource: 'USERS',
      actions: ['create', 'read', 'update', 'delete'],
      conditions: {
        childUnitsIncluded: true,
        tenantScoped: false,
      },
    },
    {
      resource: 'SOCIAL_MEDIAS',
      actions: ['create', 'read', 'update', 'delete'],
      conditions: {
        childUnitsIncluded: true,
        tenantScoped: false,
      },
    },
    {
      resource: 'FLAGS',
      actions: ['create', 'read', 'update', 'delete'],
      conditions: {
        childUnitsIncluded: true,
        tenantScoped: false,
      },
    },
    {
      resource: 'POLICIES',
      actions: ['create', 'read', 'update', 'delete'],
      conditions: {
        tenantScoped: false,
      },
    },
    {
      resource: 'REVIEW_REQUESTS',
      actions: ['read', 'update'],
      conditions: {
        tenantScoped: false,
      },
    },
    {
      resource: 'AUDIT_LOGS',
      actions: ['read'],
      conditions: {
        tenantScoped: false,
      },
    },
  ],
  [UserRolesEnum.CentralAdmin]: [
    {
      resource: 'DASHBOARD',
      actions: ['read', 'update'],
      conditions: {
        tenantScoped: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'UNITS',
      actions: ['create', 'read', 'update'],
      conditions: {
        tenantScoped: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'USERS',
      actions: ['create', 'read', 'update', 'delete'],
      conditions: {
        tenantScoped: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'SOCIAL_MEDIAS',
      actions: ['create', 'read', 'update', 'delete'],
      conditions: {
        tenantScoped: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'FLAGS',
      actions: ['create', 'read', 'update'],
      conditions: {
        tenantScoped: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'POLICIES',
      actions: ['create', 'read', 'update'],
      conditions: {
        tenantScoped: true,
      },
    },
    {
      resource: 'REVIEW_REQUESTS',
      actions: ['read', 'update'],
      conditions: {
        tenantScoped: true,
      },
    },
    {
      resource: 'AUDIT_LOGS',
      actions: ['read'],
      conditions: {
        tenantScoped: true,
        childUnitsIncluded: true,
      },
    },
  ],
  [UserRolesEnum.UnitAdmin]: [
    {
      resource: 'DASHBOARD',
      actions: ['create', 'read', 'update', 'delete'],
      conditions: {
        tenantScoped: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'UNITS',
      actions: ['read', 'update'],
      conditions: {
        tenantScoped: true,
        unitOnly: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'USERS',
      actions: ['create', 'read', 'update'],
      conditions: {
        tenantScoped: true,
        unitOnly: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'SOCIAL_MEDIAS',
      actions: ['create', 'read', 'update'],
      conditions: {
        tenantScoped: true,
        unitOnly: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'FLAGS',
      actions: ['create', 'read', 'update'],
      conditions: {
        tenantScoped: true,
        unitOnly: true,
        childUnitsIncluded: true,
      },
    },
    {
      resource: 'POLICIES',
      actions: ['read'],
      conditions: {
        tenantScoped: true,
      },
    },
    {
      resource: 'AUDIT_LOGS',
      actions: ['read'],
      conditions: {
        tenantScoped: true,
        unitOnly: true,
        childUnitsIncluded: true,
      },
    },
  ],
  [UserRolesEnum.SocialMediaManager]: [
    {
      resource: 'DASHBOARD',
      actions: ['create', 'read', 'update', 'delete'],
      conditions: {
        tenantScoped: true,
        ownerOnly: true,
      },
    },
    {
      resource: 'UNITS',
      actions: ['read'],
      conditions: {
        tenantScoped: true,
        unitOnly: true,
      },
    },
    {
      resource: 'USERS',
      actions: ['read', 'update'],
      conditions: {
        tenantScoped: true,
        ownerOnly: true,
      },
    },
    {
      resource: 'SOCIAL_MEDIAS',
      actions: ['read'],
      conditions: {
        tenantScoped: true,
        ownerOnly: true,
      },
    },
    {
      resource: 'FLAGS',
      actions: ['read'],
      conditions: {
        tenantScoped: true,
        ownerOnly: true,
      },
    },
    {
      resource: 'POLICIES',
      actions: ['read'],
      conditions: {
        tenantScoped: true,
      },
    },
  ],
}
