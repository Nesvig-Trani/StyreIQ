import { UpdateSocialMediaForm } from '@/social-medias/forms/update-social-media'
import { getUsersByRoles, UserRolesEnum } from '@/users'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { getSocialMediaById } from '@/plugins/social-medias/queries'
import { getAllOrganizations } from '@/plugins/organizations/queries'
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

  const users = await getUsersByRoles([UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager])

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
