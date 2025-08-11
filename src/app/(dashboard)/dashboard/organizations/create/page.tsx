'use server'
import React from 'react'
import { CreateOrganizationForm } from '@/features/organizations'
import { getAllUsers, UserRolesEnum } from '@/features/users'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import Link from 'next/link'
import { getAllOrganizations } from '@/features/organizations/plugins/queries'
import { Button } from '@/shared/components/ui/button'
import { ensureStyreIQOrganization } from '@/features/organizations'

export default async function CreateOrganization() {
  const { user } = await getAuthUser()

  // Ensure StyreIQ organization exists
  await ensureStyreIQOrganization()

  const organizations = await getAllOrganizations()
  const users = await getAllUsers()

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

  // Find StyreIQ organization to set as default parent
  const styreIQOrg = organizations.docs.find((org) => org.name === 'StyreIQ')

  if (!styreIQOrg) {
    throw new Error('StyreIQ organization not found')
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
      <CreateOrganizationForm
        userRole={user?.role as UserRolesEnum}
        users={users.docs}
        organizations={organizations.docs}
        defaultParentOrg={styreIQOrg?.id?.toString()}
      />
    </div>
  )
}
