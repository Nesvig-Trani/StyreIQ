'use client'
import React from 'react'
import useCreateOrganization from '@/organizations/hooks/useCreateOrganization'
import { CreateOrgFormProps } from '@/organizations'

export const CreateOrganizationForm = ({ users, organizations }: CreateOrgFormProps) => {
  const { formComponent } = useCreateOrganization({
    users,
    organizations,
  })
  return <div>{formComponent}</div>
}
