'use server'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, UnitAccessForm } from '@/shared'
import { getUserById } from '@/features/users'
import { getUnitAccessByUserId } from '@/features/organizations'

async function UserAccessPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  const user = await getUserById({ id: Number(userId) })
  const userOrgs = await getUnitAccessByUserId({ id: Number(userId) })

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle> Set unit access</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <b>Name: </b>
            {user.name}
          </p>
          <p>
            <b>Email: </b> {user.email}
          </p>
          <UnitAccessForm initialAccess={userOrgs.docs} />
        </CardContent>
      </Card>
    </div>
  )
}

export default UserAccessPage
