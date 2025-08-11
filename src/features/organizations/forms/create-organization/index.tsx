'use client'
import React from 'react'
import useCreateOrganization from '@/features/organizations/hooks/useCreateOrganization'
import { CreateOrgFormProps } from '@/features/organizations'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared'

export const CreateOrganizationForm = ({
  userRole,
  users,
  organizations,
  defaultParentOrg,
}: CreateOrgFormProps) => {
  const { formComponent } = useCreateOrganization({
    userRole,
    users,
    organizations,
    defaultParentOrg,
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
