import React from 'react'
import { AppSidebar } from '@/shared/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/shared/components/ui/sidebar'
import { serverAuthGuard } from '@/features/auth/hooks/serverAuthGuard'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { getLastPolicyVersion, hasUserAcknowledged } from '@/features/policies/plugins/queries'
import { UserRolesEnum } from '@/features/users'
import {
  LexicalContentModal,
  LexicalData,
} from '@/shared/components/rich-text-editor/preview-modal'
import { Separator } from '@/shared/components/ui/separator'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { TenantBadge } from './tenant-badge'
import { getServerTenantContext } from './server-tenant-context'
import { TenantProvider } from '@/features/tenants/contexts/tenant-context'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  description: 'StyreIQ Dashboard',
  title: 'StyreIQ Dashboard',
}

export default async function DashboardLayout(props: { children: React.ReactNode }) {
  const { children } = props

  await serverAuthGuard()
  const { user } = await getAuthUser()
  const { payload } = await getPayloadContext()

  if (!user) {
    return (
      <div className="p-4">
        <p className="text-center text-muted-foreground">
          You must be logged in to view this page.
        </p>
      </div>
    )
  }

  const tenantContext = await getServerTenantContext(user, payload)
  const effectiveRole = getEffectiveRoleFromUser(user)

  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin

  let userTenantData = null
  if (user.tenant) {
    const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant

    userTenantData = await payload.findByID({
      collection: 'tenants',
      id: tenantId,
    })
  }

  await payload.jobs.queue({
    task: 'detectRisks',
    input: {},
  })
  await payload.jobs.run()

  const lastVersion = await getLastPolicyVersion()
  let showPolicyModal = false

  if (user.id && !isSuperAdmin && lastVersion) {
    const userAcknowledged = await hasUserAcknowledged({
      userId: user.id,
      lastVersionId: lastVersion.id,
    })
    showPolicyModal = !userAcknowledged
  }

  return (
    <TenantProvider
      user={user}
      initialSelectedTenant={tenantContext.selectedTenant}
      initialAvailableTenants={tenantContext.availableTenants}
    >
      <SidebarProvider>
        <AppSidebar user={user} tenant={userTenantData} />

        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 sm:px-4 lg:hidden">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <span className="text-base lg:text-lg font-semibold">StyreIQ</span>

            <div className="ml-auto hidden lg:block">
              <TenantBadge
                tenant={tenantContext.selectedTenant || userTenantData}
                isViewingAllTenants={tenantContext.isViewingAllTenants}
                userRole={effectiveRole}
              />
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-3 sm:p-4 bg-gray-50">{children}</div>

          {lastVersion?.text && (
            <LexicalContentModal
              title="Your organization has updated this policy/guidelines. Please review and acknowledge."
              open={showPolicyModal}
              lexicalData={lastVersion.text as unknown as LexicalData}
              showActions
              triggerButton={false}
              policy={lastVersion.id}
            />
          )}
        </SidebarInset>
      </SidebarProvider>
    </TenantProvider>
  )
}
