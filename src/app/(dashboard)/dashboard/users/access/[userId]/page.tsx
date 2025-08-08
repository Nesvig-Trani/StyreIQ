'use server'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, OrganizationAccessForm } from '@/shared'
import { getUserById } from '@/features/users'
import { getOrganizationAccessByUserId } from '@/features/organizations'

async function UserAccessPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  const user = await getUserById({ id: Number(userId) })
  const userOrgs = await getOrganizationAccessByUserId({ id: Number(userId) })

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle> Set organization access</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <b>Name: </b>
            {user.name}
          </p>
          <p>
            <b>Email: </b> {user.email}
          </p>
          <OrganizationAccessForm initialAccess={userOrgs.docs} />
        </CardContent>
      </Card>
    </div>
  )
}

export default UserAccessPage
