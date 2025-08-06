'use client'

import React from 'react'
import useUpdateUserForm from '../../hooks/useUpdateUserForm'
import { UpdateUserFormProps } from '@/features/users'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared'

export const UpdateUserForm = ({ organizations, id, data }: UpdateUserFormProps) => {
  const { formComponent } = useUpdateUserForm({
    organizations,
    id,
    data,
  })

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Update user</CardTitle>
      </CardHeader>
      <CardContent>{formComponent}</CardContent>
    </Card>
  )
}
