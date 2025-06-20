import React from 'react'
import { CreateUserForm, UserRolesEnum } from '@/users/'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { Organization } from '@/payload-types'
import { getAllOrganizations } from '@/organizations/queries'

export default async function CreateUserPage() {
  const { user } = await getAuthUser()

  const organizations = await getAllOrganizations()

  const userOrgs = user?.organizations as Organization[]

  const orgsWithDefinedDepth = userOrgs.filter(
    (org) => org.depth !== null && org.depth !== undefined,
  )
  const orgWithMinDepth =
    orgsWithDefinedDepth.length > 0
      ? orgsWithDefinedDepth.reduce((min, current) =>
          (current.depth ?? Infinity) < (min.depth ?? Infinity) ? current : min,
        )
      : undefined

  return (
    <div>
        <CreateUserForm
          initialOrganizations={organizations.docs}
          authUserRole={user?.role as UserRolesEnum}
          topOrgDepth={orgWithMinDepth?.depth || undefined}
        />
    </div>
  )
}
