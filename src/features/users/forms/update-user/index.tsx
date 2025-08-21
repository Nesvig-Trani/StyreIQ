'use client'

import React from 'react'
import useUpdateUserForm from '../../hooks/useUpdateUserForm'
import { UpdateUserFormProps } from '@/features/users'

export const UpdateUserForm = ({ organizations, id, data }: UpdateUserFormProps) => {
  const { formComponent } = useUpdateUserForm({
    organizations,
    id,
    data,
  })

  return <div>{formComponent}</div>
}
