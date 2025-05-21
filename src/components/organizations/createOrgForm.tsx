'use client'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Organization, User } from '@/payload-types'
import { createOrganization } from '@/services/organization'
import { createOrgFormSchema } from '@/schemas/organization'
import { Tree } from '@/types/organizations'
import { toast } from 'sonner'
import { useFormHelper } from '@/components/form-hook-helper'

type CreateOrgFormProps = {
  users: User[]
  tree: Tree[]
  organizations: Organization[]
}

export const CreateOrgForm = ({ users, organizations, tree }: CreateOrgFormProps) => {
  const { formComponent, form } = useFormHelper(
    {
      schema: createOrgFormSchema,
      fields: [
        {
          label: 'Name',
          name: 'name',
          type: 'text',
        },
        {
          label: 'Type',
          name: 'type',
          type: 'select',
          options: [
            { value: 'university', label: 'University' },
            { value: 'faculty', label: 'Faculty' },
            { value: 'department', label: 'Department' },
            { value: 'office', label: 'Office' },
            { value: 'project', label: 'Project' },
          ],
        },
        {
          label: 'Parent',
          name: 'parent',
          type: 'tree-select',
          options: organizations.map((org) => ({
            value: org.id.toString(),
            label: org.name,
          })),
          tree: tree,
        },
        {
          label: 'Admin',
          name: 'admin',
          type: 'select',
          options: users.map((user) => ({
            value: user.id.toString(),
            label: user.name,
          })),
        },
        {
          label: 'Backup Admins',
          name: 'backupAdmins',
          type: 'multiselect',
          options: users.map((user) => ({
            value: user.id.toString(),
            label: user.name,
          })),
        },
        {
          label: 'Email',
          name: 'email',
          type: 'text',
        },
        {
          label: 'Phone',
          name: 'phone',
          type: 'text',
        },
        {
          label: 'Status',
          name: 'status',
          type: 'select',
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'pending_review', label: 'Pending Review' },
          ],
        },
        {
          label: 'Description',
          name: 'description',
          type: 'textarea',
        },
        {
          label: 'Delegated Permissions',
          name: 'delegatedPermissions',
          type: 'checkbox',
          checkboxMode: 'boolean',
        },
      ],
      onSubmit: async (submitData) => {
        try {
          await createOrganization(submitData)
          form.reset()
          toast.success('Organization created successfully')
        } catch {
          toast.error('An error occurred while creating the organization, please try again')
        }
      },
    },
    {
      defaultValues: {
        name: '',
        type: 'university',
        parent: '',
        admin: '',
        email: '',
        phone: '',
        status: 'active',
        description: '',
        delegatedPermissions: false,
        backupAdmins: [],
      },
    },
  )

  return <div>{formComponent}</div>
}
