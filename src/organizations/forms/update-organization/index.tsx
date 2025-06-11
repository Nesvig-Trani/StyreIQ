'use client'
import React from 'react'
import useUpdateOrganization from '@/organizations/hooks/useUpdateOrganization'
import { UpdateOrgFormProps } from '@/organizations'

export const CreateOrganizationForm = ({ users, organizations,data }: UpdateOrgFormProps) => {
  const { formComponent } = useUpdateOrganization({
    users,
    organizations,
    data
  })
  return <div>{formComponent}</div>
}
