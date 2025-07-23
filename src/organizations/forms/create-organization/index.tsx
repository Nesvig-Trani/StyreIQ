'use client'
import React from 'react'
import useCreateOrganization from '@/organizations/hooks/useCreateOrganization'
import { CreateOrgFormProps } from '@/organizations'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared'

export const CreateOrganizationForm = ({ userRole, users, organizations }: CreateOrgFormProps) => {
  const { formComponent } = useCreateOrganization({
    userRole,
    users,
    organizations,
  })
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create organization</CardTitle>
      </CardHeader>
      <CardContent>{formComponent}</CardContent>
    </Card>
  )
}
