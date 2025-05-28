'use client'

import React from 'react'
import useUpdateUserForm from '@/users/hooks/useUpdateUserForm'
import { UpdateUserFormProps } from '@/users'

export const UpdateUserForm = ({ organizations, tree, id, data }: UpdateUserFormProps) => {
  const { formComponent } = useUpdateUserForm({
    organizations,
    tree,
    id,
    data,
  })

  return <div>{formComponent}</div>
}
