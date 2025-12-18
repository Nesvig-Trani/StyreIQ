import { Resource, ResourceAction } from '@/shared/constants/rbac'
import {
  BadgePlus,
  Building2Icon,
  FlagIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  LucideIcon,
  ScrollText,
  Share2Icon,
  UsersIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  permission: {
    resource: Resource
    action: ResourceAction
  }
}

export const mainNavigation: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboardIcon,
    permission: {
      resource: 'DASHBOARD',
      action: 'read',
    },
  },
  {
    title: 'Tenants',
    url: '/dashboard/tenants',
    icon: Building2Icon,
    permission: {
      resource: 'TENANTS',
      action: 'read',
    },
  },
  {
    title: 'Units',
    url: '/dashboard/units',
    icon: Building2Icon,
    permission: {
      resource: 'UNITS',
      action: 'read',
    },
  },
  {
    title: 'Users',
    url: '/dashboard/users',
    icon: UsersIcon,
    permission: {
      resource: 'USERS',
      action: 'read',
    },
  },
  {
    title: 'Social Media',
    url: '/dashboard/social-media-accounts',
    icon: Share2Icon,
    permission: {
      resource: 'SOCIAL_MEDIAS',
      action: 'read',
    },
  },
  {
    title: 'Policy',
    url: '/dashboard/policies',
    icon: ScrollText,
    permission: {
      resource: 'POLICIES',
      action: 'read',
    },
  },
  {
    title: 'Risk Flags',
    url: '/dashboard/flags',
    icon: FlagIcon,
    permission: {
      resource: 'FLAGS',
      action: 'read',
    },
  },
  {
    title: 'Audit Log',
    url: '/dashboard/audit-logs',
    icon: HistoryIcon,
    permission: {
      resource: 'AUDIT_LOGS',
      action: 'read',
    },
  },
  {
    title: 'Role Request',
    url: '/dashboard/role-request',
    icon: BadgePlus,
    permission: {
      resource: 'ROLE_REQUESTS',
      action: 'read',
    },
  },
]
