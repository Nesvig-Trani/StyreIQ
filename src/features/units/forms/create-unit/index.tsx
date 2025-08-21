'use client'
import React from 'react'
import useCreateUnit from '@/features/units/hooks/useCreateUnit'
import { CreateUnitFormProps } from '@/features/units'

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
  return <div>{formComponent}</div>
}
