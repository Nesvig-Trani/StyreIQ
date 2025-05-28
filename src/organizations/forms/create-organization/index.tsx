'use client'
import React from 'react'
import useCreateOrganization from '@/organizations/hooks/useCreateOrganization'
import { CreateOrgFormProps } from '@/organizations'

export const CreateOrganizationForm = ({ users, organizations, tree }: CreateOrgFormProps) => {
  const { formComponent } = useCreateOrganization({
    users,
    organizations,
    tree,
  })
  return <div>{formComponent}</div>
}
