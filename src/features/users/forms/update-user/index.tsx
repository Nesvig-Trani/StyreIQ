'use client'

import React from 'react'
import useUpdateUserForm from '../../hooks/useUpdateUserForm'
import { UpdateUserFormProps } from '@/features/users'

export const UpdateUserForm = ({ organizations, id, data, authUserRole }: UpdateUserFormProps) => {
  const { formComponent } = useUpdateUserForm({
    organizations,
    id,
    data,
    authUserRole,
  })

  return <div>{formComponent}</div>
}
