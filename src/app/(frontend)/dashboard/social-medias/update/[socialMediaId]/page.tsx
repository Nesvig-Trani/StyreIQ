import { UpdateSocialMediaForm } from '@/features/social-medias/forms/update-social-media'
import { getUsersByRoles, UserRolesEnum } from '@/features/users'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { getSocialMediaById } from '@/features/social-medias/plugins/queries'
import { getAllOrganizations } from '@/features/organizations/plugins/queries'
import React from 'react'

export default async function UpdateSocialMediaPage({
  params,
}: {
  params: Promise<{ socialMediaId: string }>
}) {
  const { socialMediaId } = await params
  if (!socialMediaId) return <div>404</div>

  const data = await getSocialMediaById({ id: Number(socialMediaId) })
  if (!data) {
    return (
      <div>
        <h1>404</h1>
      </div>
    )
  }
  const { user } = await getAuthUser()

  const users = await getUsersByRoles([UserRolesEnum.SuperAdmin, UserRolesEnum.UnitAdmin])

  const organizations = await getAllOrganizations()
  return (
    <div>
      <UpdateSocialMediaForm
        data={data}
        users={users.docs}
        organizations={organizations.docs}
        user={user}
      />
    </div>
  )
}
