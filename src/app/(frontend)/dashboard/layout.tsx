import React from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { headers as getHeaders } from 'next/dist/server/request/headers'
import { redirect } from 'next/navigation'
import { env } from '@/config/env'

export const metadata = {
  description: 'GovernIq Dashboard',
  title: 'GovernIq Dashboard',
}

export default async function DashboardLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const headers = await getHeaders()

  const res = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users/me`, {
    headers: {
      cookie: headers.get('cookie') || '',
    },
    cache: 'no-store',
  })

  const admin = await res.json()

  if (!admin) {
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
