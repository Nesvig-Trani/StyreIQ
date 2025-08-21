import React from 'react'
import { CreateUserForm, UserRolesEnum } from '@/features/users'
import { Organization } from '@/types/payload-types'
import { getAllUnits } from '@/features/units/plugins/queries'
import { checkUserCreateAccess } from '@/shared'
import { buildAccessibleUnitFilter } from '@/features/units/plugins/utils'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'

export default async function CreateUserPage() {
  const { user, accessDenied, component } = await checkUserCreateAccess()

  if (accessDenied) {
    return component
  }

  let organizations: Organization[] = []

  if (user?.role === UserRolesEnum.SuperAdmin) {
    const allUnits = await getAllUnits()
    organizations = allUnits.docs
  } else {
    const { payload } = await getPayloadContext()
    const userOrgs = user?.organizations as Organization[]

    if (userOrgs && userOrgs.length > 0) {
      const whereOrg = buildAccessibleUnitFilter({ orgs: userOrgs })
      const accessibleUnits = await payload.find({
        collection: 'organization',
        where: whereOrg,
        limit: 0,
      })
      organizations = accessibleUnits.docs
    }
  }

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
        initialOrganizations={organizations}
        authUserRole={user?.role as UserRolesEnum}
        topOrgDepth={orgWithMinDepth?.depth || undefined}
      />
    </div>
  )
}
