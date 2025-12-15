import { socialMediaSearchSchema } from '@/features/social-medias/schemas'

//Components
import { DashboardSocialMedias } from '@/features/social-medias'

//Interfaces and types
import { parseSearchParamsWithSchema, type AppPageProps } from '@/shared'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { getSocialMediaAccounts } from '@/features/social-medias/plugins/queries'
import { getAllUnits } from '@/features/units/plugins/queries'
import { getAllUsers } from '@/features/users'
import { getSocialMediaAuditLogs } from '@/features/audit-log/plugins/queries'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { getServerTenantContext } from '../../server-tenant-context'

export default async function SocialMediasPage(props: AppPageProps) {
  const { user } = await getAuthUser()
  const { payload } = await getPayloadContext()
  const tenantContext = await getServerTenantContext(user, payload)
  if (!user) {
    return (
      <div className="p-4">
        <p className="text-center text-muted-foreground">
          You must be logged in to view this page.
        </p>
      </div>
    )
  }

  const searchParams = await props.searchParams

  const parsedParams = parseSearchParamsWithSchema(searchParams, socialMediaSearchSchema)

  const socialMediaAccounts = await getSocialMediaAccounts({
    pageIndex: parsedParams.pagination.pageIndex,
    pageSize: parsedParams.pagination.pageSize,
    status: parsedParams.status,
    platform: parsedParams.platform,
    organization: parsedParams.organization,
    primaryAdmin: parsedParams.primaryAdmin,
  })

  const organizations = await getAllUnits()
  const users = await getAllUsers()

  let socialMediasWithAuditLogs = socialMediaAccounts.docs

  if (user?.role === 'super_admin') {
    socialMediasWithAuditLogs = await Promise.all(
      socialMediaAccounts.docs.map(async (socialMedia) => {
        const auditLogs = await getSocialMediaAuditLogs({
          socialMediaId: socialMedia.id,
        })

        return {
          ...socialMedia,
          auditLogs,
        }
      }),
    )
  }

  return (
    <DashboardSocialMedias
      user={user}
      socialMedias={{
        ...socialMediaAccounts,
        docs: socialMediasWithAuditLogs,
      }}
      organizations={organizations.docs}
      users={users.docs}
      isViewingAllTenants={tenantContext.isViewingAllTenants}
    />
  )
}
