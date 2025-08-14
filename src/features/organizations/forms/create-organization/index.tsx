'use client'
import React from 'react'
import useCreateUnit from '@/features/organizations/hooks/useCreateUnit'
import { CreateUnitFormProps } from '@/features/organizations'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared'

export const CreateUnitForm = ({
  userRole,
  users,
  organizations,
  defaultParentOrg,
}: CreateUnitFormProps) => {
  const { formComponent } = useCreateUnit({
    userRole,
    users,
    organizations,
    defaultParentOrg,
  })
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create unit</CardTitle>
      </CardHeader>
      <CardContent>{formComponent}</CardContent>
    </Card>
  )
}
