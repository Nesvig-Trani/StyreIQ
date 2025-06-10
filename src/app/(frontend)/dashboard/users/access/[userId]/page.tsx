'use server'
import React from 'react'
import { OrganizationAccessForm } from '@/shared'
import { getUserById } from '@/users'
import { getOrganizationAccessByUserId } from '@/organization-access/queries'

async function UserAccessPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  const user = await getUserById({ id: Number(userId) })
  const userOrgs = await getOrganizationAccessByUserId({ id: Number(userId) })

  return (
    <div>
      <h1>Set organization access</h1>
      <p>
        {user.name} - {user.email}
      </p>
      <OrganizationAccessForm initialAccess={userOrgs.docs} />
    </div>
  )
}

export default UserAccessPage
