'use client'
import React from 'react'
import { CreateSocialMediaFormProps, useCreateSocialMedia } from '@/features/social-medias'

export const CreateSocialMediaForm: React.FC<CreateSocialMediaFormProps> = ({
  users,
  organizations,
  currentUser,
}) => {
  const { formComponent } = useCreateSocialMedia({
    users,
    organizations,
    currentUser,
  })

  return <div>{formComponent}</div>
}
