'use client'
import React from 'react'

import { CreateSocialMediaFormProps, useCreateSocialMedia } from '@/social-medias'

export const CreateSocialMediaForm: React.FC<CreateSocialMediaFormProps> = ({
  users,
  organizations,
}) => {
  const { formComponent } = useCreateSocialMedia({
    users,
    organizations,
  })
  return <div>{formComponent}</div>
}
