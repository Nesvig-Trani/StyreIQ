'use client'

import React from 'react'
import useUpdateUserForm from '@/users/hooks/useUpdateUserForm'
import { UpdateUserFormProps } from '@/users'

export const UpdateUserForm = ({ organizations, id, data }: UpdateUserFormProps) => {
  const { formComponent } = useUpdateUserForm({
    organizations,
    id,
    data,
  })

  return <div>{formComponent}</div>
}
