'use client'

import { updateUserFormSchema } from '@/schemas/users'
import { Organization, User } from '@/payload-types'
import { updateUser } from '@/services/users'
import { roleLabelMap, statusLabelMap, UserRolesEnum, UserStatusEnum } from '@/types/users'

import React from 'react'
import { Tree } from '@/types/organizations'
import { useFormHelper } from '@/components/form-hook-helper'

import { toast } from 'sonner'

type CreateUserFormProps = {
  tree: Tree[]
  organizations: Organization[]
  id: string
  data: User
}

export const UpdateUserForm = ({ organizations, tree, id, data }: CreateUserFormProps) => {
  const { formComponent } = useFormHelper(
    {
      schema: updateUserFormSchema,
      fields: [
        {
          label: 'Email',
          name: 'email',
          type: 'text',
        },
        {
          label: 'Name',
          name: 'name',
          type: 'text',
        },
        {
          label: 'Role',
          name: 'role',
          type: 'select',
          options: Object.values(UserRolesEnum).map((role) => ({
            label: roleLabelMap[role],
            value: role,
          })),
        },
        {
          label: 'Status',
          name: 'status',
          type: 'select',
          options: Object.values(UserStatusEnum).map((status) => ({
            label: statusLabelMap[status],
            value: status,
          })),
        },
        {
          label: 'Organization',
          name: 'organization',
          type: 'tree-select',
          options: organizations.map((org) => ({
            value: org.id.toString(),
            label: org.name,
          })),
          tree: tree,
        },
      ],
      onSubmit: async (submitData) => {
        try {
          await updateUser(id, submitData)
          toast.success('User updated successfully')
        } catch {
          toast.error('An error occurred while updating the user, please try again')
        }
      },
      submitContent: 'Update User',
    },
    {
      defaultValues: {
        email: data.email,
        name: data.name,
        role: data.role as UserRolesEnum,
        status: data.status as UserStatusEnum,
        organization: data.organization?.toString(),
      },
    },
  )

  return <div>{formComponent}</div>
}
