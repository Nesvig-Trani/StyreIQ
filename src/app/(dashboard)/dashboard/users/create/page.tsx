import React from 'react'
import { CreateUserForm, UserRolesEnum } from '@/features/users'
import { Organization } from '@/types/payload-types'
import { getAllUnits } from '@/features/units/plugins/queries'
import { checkUserCreateAccess } from '@/shared'

export default async function CreateUserPage() {
  const { user, accessDenied, component } = await checkUserCreateAccess()

  if (accessDenied) {
    return component
  }

  const organizations = await getAllUnits()

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
