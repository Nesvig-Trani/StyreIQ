'use client'
import React from 'react'
import { CreateSocialMediaFormProps, useCreateSocialMedia } from '@/features/social-medias'

export const CreateSocialMediaForm: React.FC<CreateSocialMediaFormProps> = ({
  users,
  organizations,
  currentUser,
  selectedTenantId,
}) => {
  const { formComponent } = useCreateSocialMedia({
    users,
    organizations,
    currentUser,
    selectedTenantId,
  })

  return <div>{formComponent}</div>
}
