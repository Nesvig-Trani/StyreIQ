'use server'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, UnitAccessForm } from '@/shared'
import { getUserById } from '@/features/users'
import { getUnitAccessByUserId } from '@/features/units'
import { checkUserUpdateAccess } from '@/shared'
import { buildAccessibleUnitFilter } from '@/features/units/plugins/utils'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { UserRolesEnum } from '@/features/users'
import { Organization } from '@/types/payload-types'

async function UserAccessPage({ params }: { params: Promise<{ userId: string }> }) {
  const { user, accessDenied, component } = await checkUserUpdateAccess()

  if (accessDenied) {
    return component
  }

  const { userId } = await params

  const userData = await getUserById({ id: Number(userId) })
  const userOrgs = await getUnitAccessByUserId({ id: Number(userId) })

  let filteredUserOrgs = userOrgs

  if (user?.role === UserRolesEnum.UnitAdmin) {
    const { payload } = await getPayloadContext()
    const adminOrgs = user?.organizations as Organization[]

    if (adminOrgs && adminOrgs.length > 0) {
      const whereOrg = buildAccessibleUnitFilter({ orgs: adminOrgs })
      const accessibleUnits = await payload.find({
        collection: 'organization',
        where: whereOrg,
        limit: 0,
      })

      const accessibleOrgIds = accessibleUnits.docs.map((org) => org.id)

      filteredUserOrgs = {
        ...userOrgs,
        docs: userOrgs.docs.filter((access) => {
          if (!access.organization) return false
          const orgId =
            typeof access.organization === 'object' ? access.organization.id : access.organization
          return accessibleOrgIds.includes(orgId)
        }),
      }
    }
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle> Set unit access</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <b>Name: </b>
            {userData.name}
          </p>
          <p>
            <b>Email: </b> {userData.email}
          </p>
          <UnitAccessForm initialAccess={filteredUserOrgs.docs} />
        </CardContent>
      </Card>
    </div>
  )
}

export default UserAccessPage
