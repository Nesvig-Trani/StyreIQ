import { getAuthUser } from '@/auth/utils/getAuthUser'
import { getAllOrganizations } from '@/organizations/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared'
import { CreateSocialMediaForm } from '@/social-medias'
import { getUsersByRoles, UserRolesEnum } from '@/users'
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
    redirect('/dashboard/social-medias')
  }

  const users = await getUsersByRoles([UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager])

  const organizations = await getAllOrganizations()

  return (
    <div>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create social media</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateSocialMediaForm users={users.docs} organizations={organizations.docs} />
        </CardContent>
      </Card>
    </div>
  )
}
