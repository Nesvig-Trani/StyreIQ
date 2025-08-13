import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { getAllOrganizations } from '@/features/organizations/plugins/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared'
import { CreateSocialMediaForm } from '@/features/social-medias'
import { getUsersByRoles, UserRolesEnum } from '@/features/users'
import { redirect } from 'next/navigation'

export default async function CreateSocialMediaPage() {
  const { user } = await getAuthUser()

  if (
    !(
      user &&
      user.role &&
      [UserRolesEnum.SuperAdmin, UserRolesEnum.UnitAdmin].includes(user.role as UserRolesEnum)
    )
  ) {
    redirect('/dashboard/social-media-accounts')
  }

  const users = await getUsersByRoles([
    UserRolesEnum.SuperAdmin,
    UserRolesEnum.UnitAdmin,
    UserRolesEnum.SocialMediaManager,
  ])

  const organizations = await getAllOrganizations()

  return (
    <div>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create Social Media Account</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateSocialMediaForm users={users.docs} organizations={organizations.docs} />
        </CardContent>
      </Card>
    </div>
  )
}
