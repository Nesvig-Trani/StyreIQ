'use server'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, UnitAccessForm } from '@/shared'
import { getUserById } from '@/features/users'
import { getUnitAccessByUserId } from '@/features/units'
import { checkUserUpdateAccess } from '@/shared'

async function UserAccessPage({ params }: { params: Promise<{ userId: string }> }) {
  const { user: _user, accessDenied, component } = await checkUserUpdateAccess()

  if (accessDenied) {
    return component
  }

  const { userId } = await params

  const userData = await getUserById({ id: Number(userId) })
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
            {userData.name}
          </p>
          <p>
            <b>Email: </b> {userData.email}
          </p>
          <UnitAccessForm initialAccess={userOrgs.docs} />
        </CardContent>
      </Card>
    </div>
  )
}

export default UserAccessPage
