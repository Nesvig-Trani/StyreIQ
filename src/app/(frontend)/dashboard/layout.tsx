import React from 'react'
import { AppSidebar } from '@/shared'
import { SidebarInset, SidebarProvider } from '@/shared/components/ui/sidebar'
import { verifyUser } from '@/auth/utils/getAuthUser'
import { redirect } from 'next/navigation'
import { logout } from '@/sdk/users'
import { headers as getHeaders } from 'next/headers'

export const metadata = {
  description: 'GovernIq Dashboard',
  title: 'GovernIq Dashboard',
}

export default async function DashboardLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const user = await verifyUser()
  if (!user) {
    const headers = await getHeaders()
    const cookie = headers.get('cookie')
    if (cookie) {
      await logout({ cookie: headers.get('cookie') || '' })
    }
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
