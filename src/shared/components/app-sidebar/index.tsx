'use client'
import * as React from 'react'
import {
  Building2Icon,
  HistoryIcon,
  LogOutIcon,
  ScrollText,
  Share2Icon,
  UsersIcon,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/shared/components/ui/sidebar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import { UserRolesEnum } from '@/users'

const data = {
  navMain: [
    {
      title: 'Organizations',
      url: '/dashboard/organizations',
      icon: Building2Icon,
    },
    {
      title: 'Users',
      url: '/dashboard/users',
      icon: UsersIcon,
    },
    {
      title: 'Social Medias',
      url: '/dashboard/social-medias',
      icon: Share2Icon,
    },
    {
      title: 'Policy',
      url: '/dashboard/policies',
      icon: ScrollText,
    },
    {
      title: 'Audit Log',
      url: '/dashboard/audit-logs',
      icon: HistoryIcon,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole?: UserRolesEnum | null
}

export function AppSidebar({ userRole, ...props }: AppSidebarProps) {
  const router = useRouter()
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">GovernIq</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain
              .filter((item) => {
                if (item.title === 'Policy' && userRole !== UserRolesEnum.SuperAdmin) return false
                return true
              })
              .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.url}>
                    <SidebarMenuButton>
                      {item.icon && <item.icon />}
                      <span className="font-medium cursor-pointer">{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </SidebarGroup>
        <Button onClick={() => router.push('/api/logout')}>
          <LogOutIcon />
        </Button>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
