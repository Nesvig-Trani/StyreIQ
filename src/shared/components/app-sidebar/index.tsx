'use client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarRail,
} from '@/shared/components/ui/sidebar'
import { LogOut, Building2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { Tenant, User } from '@/types/payload-types'
import { useAccess } from '@/shared/hooks/use-access'
import { mainNavigation } from './nav-config'
import { roleLabelMap, UserRolesEnum } from '@/features/users'
import { TenantSelector } from '@/features/tenants/components/tenant-selector'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User
  tenant?: Tenant | null
}

export function AppSidebar({ user, tenant, ...props }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { can } = useAccess(user)

  const isSuperAdmin = user.role === UserRolesEnum.SuperAdmin

  const allowedNavItems = mainNavigation.filter((item) =>
    can(item.permission.action, item.permission.resource),
  )

  const isActivePath = (url: string) => {
    if (url === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname === url || pathname.startsWith(url + '/')
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard" className="flex items-center space-x-3 px-2 py-2">
              <span className="text-xl font-bold text-gray-900">StyreIQ</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <div className="flex flex-col gap-3 px-4 pb-2">
        <div className="p-3 bg-gray-50 rounded-lg w-full">
          <div className="min-w-0">
            <div className="text-xs font-medium text-gray-900 truncate">
              {roleLabelMap[user.role as UserRolesEnum]}
            </div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        </div>

        {isSuperAdmin && <TenantSelector />}

        {tenant && !isSuperAdmin && (
          <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-blue-900 truncate">{tenant.name}</div>
                {tenant.domain && (
                  <div className="text-xs text-blue-600 truncate">{tenant.domain}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {allowedNavItems.map((item) => {
              const isActive = isActivePath(item.url)
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={`${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Link href={item.url} className="flex items-center space-x-3">
                      <item.icon
                        className={`h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-600'}`}
                      />
                      <span className="font-medium text-xs lg:text-sm text-gray-600">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              <button
                onClick={() => router.push('/api/logout')}
                className="flex w-full items-center space-x-3"
              >
                <LogOut className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-xs lg:text-sm text-gray-600">Sign Out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
