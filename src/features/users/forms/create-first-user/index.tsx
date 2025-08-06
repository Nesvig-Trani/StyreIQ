'use client'

import React from 'react'
import { useCreateFirstUserForm } from '@/features/users/hooks/useCreateFirstUserForm'

export const CreateFirstUserForm = () => {
  const { formComponent } = useCreateFirstUserForm()

  return <div>{formComponent}</div>
}
