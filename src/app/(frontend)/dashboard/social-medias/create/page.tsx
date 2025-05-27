import { getAuthUser } from '@/auth/utils/getAuthUser'
import { getAllOrganizations } from '@/organizations/queries'
import { Card, CardContent } from '@/shared/components/ui/card'
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
      <h1>Create Social Media Account</h1>
      <Card>
        <CardContent>
          <CreateSocialMediaForm users={users.docs} organizations={organizations.docs} />
        </CardContent>
      </Card>
    </div>
  )
}
