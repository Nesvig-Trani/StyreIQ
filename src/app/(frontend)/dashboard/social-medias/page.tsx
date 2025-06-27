import { socialMediaSearchSchema } from '@/social-medias/schemas'

//Components
import { DashboardSocialMedias } from '@/social-medias'

//Interfaces and types
import { parseSearchParamsWithSchema, type AppPageProps } from '@/shared'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { getSocialMediaAccounts } from '@/plugins/social-medias/queries'

export default async function SocialMediasPage(props: AppPageProps) {
  const { user } = await getAuthUser()

  const searchParams = await props.searchParams

  const parsedParams = parseSearchParamsWithSchema(searchParams, socialMediaSearchSchema)

  const socialMediaAccounts = await getSocialMediaAccounts({
    pageIndex: parsedParams.pagination.pageIndex,
    pageSize: parsedParams.pagination.pageSize,
  })

  return <DashboardSocialMedias user={user} socialMedias={socialMediaAccounts} />
}
