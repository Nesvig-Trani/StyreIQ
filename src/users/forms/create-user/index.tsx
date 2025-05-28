'use client'

import React from 'react'
import useCreateUserForm from '@/users/hooks/useCreateUserForm'
import { CreateUserFormProps } from '@/users'

export const CreateUserForm = ({ organizations }: CreateUserFormProps) => {
  const { formComponent } = useCreateUserForm({
    organizations,
  })

  return <div>{formComponent}</div>
}
