import React from 'react'
import { AppSidebar } from '@/shared'
import { SidebarInset, SidebarProvider } from '@/shared/components/ui/sidebar'
import { serverAuthGuard } from '@/auth/hooks/serverAuthGuard'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import {
  getLastPolicyVersion,
  hasUserAcknowledged,
} from '@/policies/queries'
import { UserRolesEnum } from '@/users'
import { LexicalContentModal } from '@/shared/components/rich-text-editor/preview-modal'

export const metadata = {
  description: 'GovernIq Dashboard',
  title: 'GovernIq Dashboard',
}

export default async function DashboardLayout(props: { children: React.ReactNode }) {
  const { children } = props

  await serverAuthGuard()
  const { user } = await getAuthUser()

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
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
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
