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

export default async function SocialMediasPage(props: AppPageProps) {
  const { user } = await getAuthUser()

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
    />
  )
}
