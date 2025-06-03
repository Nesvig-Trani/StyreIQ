'use client'

import React from 'react'
import useCreateUserForm from '@/users/hooks/useCreateUserForm'
import { CreateUserFormProps } from '@/users'

export const CreateUserForm = ({ organizations, user }: CreateUserFormProps) => {
  const { formComponent } = useCreateUserForm({
    organizations,
    user
  })

  return <div>{formComponent}</div>
}
