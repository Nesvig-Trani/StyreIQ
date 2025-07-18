import React from 'react'
import { AppSidebar } from '@/shared'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/shared/components/ui/sidebar'
import { serverAuthGuard } from '@/auth/hooks/serverAuthGuard'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { getLastPolicyVersion, hasUserAcknowledged } from '@/plugins/policies/queries'
import { UserRolesEnum } from '@/users'
import { LexicalContentModal } from '@/shared/components/rich-text-editor/preview-modal'
import { Separator } from '@/shared/components/ui/separator'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'

export const metadata = {
  description: 'StyreIQ Dashboard',
  title: 'StyreIQ Dashboard',
}

export default async function DashboardLayout(props: { children: React.ReactNode }) {
  const { children } = props

  await serverAuthGuard()
  const { user } = await getAuthUser()
  const { payload } = await getPayloadContext()
  await payload.jobs.queue({
    task: 'detectRisks',
    input: {},
  })
  await payload.jobs.run()
  const lastVersion = await getLastPolicyVersion()
  let open = false
  if (user && user.id && user.role !== UserRolesEnum.SuperAdmin && lastVersion) {
    const userAcknowledged = await hasUserAcknowledged({
      userId: user.id,
      lastVersionId: lastVersion.id,
    })
    if (!userAcknowledged) {
      open = true
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar userRole={user?.role as UserRolesEnum} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 sm:px-4 lg:hidden">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <span className="text-base lg:text-lg font-semibold">StyreIQ</span>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-3 sm:p-4">{children}</div>
        {lastVersion && lastVersion.text && (
          <LexicalContentModal
            title="Usage and Governance Policies"
            open={open}
            lexicalData={lastVersion?.text}
            showActions
            triggerButton={false}
            policy={lastVersion?.id}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
