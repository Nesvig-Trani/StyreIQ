import React from 'react'
import { AppSidebar } from '@/shared'
import { SidebarInset, SidebarProvider } from '@/shared/components/ui/sidebar'
import { serverAuthGuard } from '@/auth/hooks/serverAuthGuard'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { AcknowledgmentsCollectionSlug } from '@/policies/schemas'
import { getLastPolicyVersion } from '@/policies/queries'
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
  const { payload } = await getPayloadContext()

  const lastVersion = await getLastPolicyVersion()
  let open = false
  if (user && user.id && user.role !== UserRolesEnum.SuperAdmin && lastVersion) {
    const acceptedVersion = await payload.find({
      collection: AcknowledgmentsCollectionSlug,
      limit: 1,
      sort: 'version',
      where: {
        user: { equals: user.id },
        policy: { equals: lastVersion.id },
      },
    })
    if (acceptedVersion.docs.length === 0) {
      open = true
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar userRole={user?.role as UserRolesEnum} />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        <LexicalContentModal
          title="New policy version"
          open={open}
          lexicalData={lastVersion.text as any}
          showActions
          triggerButton={false}
          policy={lastVersion.id}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
