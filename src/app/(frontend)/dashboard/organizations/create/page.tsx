'use server'
import React from 'react'
import { CreateOrganizationForm } from '@/organizations'
import { getUsersByOrganizations, UserRolesEnum } from '@/users'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import Link from 'next/link'
import { getAllOrganizations } from '@/plugins/organizations/queries'
import { Button } from '@/shared/components/ui/button'

export default async function CreateOrganization() {
  const { user } = await getAuthUser()
  const organizations = await getAllOrganizations()
  const orgIds = organizations.docs.map((org) => org.id)
  const users = await getUsersByOrganizations({ orgIds })
  if (users.docs.length === 0) {
    return (
      <div>
        <h3>Please create a user before creating an organization.</h3>
        <Button>
          <Link href="/dashboard/users/create"> Create User</Link>
        </Button>
      </div>
    )
  }

  if (organizations.docs.length === 0 && user?.role !== UserRolesEnum.SuperAdmin) {
    return (
      <div>
        <h3>
          You can&#39;t create an organization without a parent organization. Please contact your
          Super Admin to request one.
        </h3>
      </div>
    )
  }
  return (
    <div>
      <CreateOrganizationForm users={users.docs} organizations={organizations.docs} />
    </div>
  )
}
