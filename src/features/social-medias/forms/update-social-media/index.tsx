'use client'
import React from 'react'
import { UpdateSocialMediaFormProps } from '@/features/social-medias'
import { useUpdateSocialMedia } from '@/features/social-medias/hooks/useUpdateSocialMedia'

export const UpdateSocialMediaForm: React.FC<UpdateSocialMediaFormProps> = ({
  data,
  users,
  organizations,
  user,
}) => {
  const { formComponent } = useUpdateSocialMedia({
    data,
    users,
    organizations,
    user,
  })

  return <div>{formComponent}</div>
}
