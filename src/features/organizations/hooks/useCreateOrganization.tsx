'use client'
import { useFormHelper } from '@/shared/components/form-hook-helper'
import {
  CreateOrgFormProps,
  createOrgFormSchema,
  OrganizationTypeEnum,
  OrganizationWithDepth,
} from '@/features/organizations'
import { createOrganization } from '@/sdk/organization'
import { toast } from 'sonner'
import { CreateOrganizationsTree } from '@/features/organizations/utils/createOrgTree'
import { useRouter } from 'next/navigation'
import { industryLevelOptions, unitLevelOptions } from '../constants/organizationTypeOptions'
import { UserRolesEnum } from '@/features/users'
import { useState, useEffect, useMemo } from 'react'
import { User } from '@/types/payload-types'
import { fetchFilteredUsers } from '../services/getFilteredUsersFromOrganization'

function useCreateOrganization({ userRole, organizations, defaultParentOrg }: CreateOrgFormProps) {
  const router = useRouter()
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])

  const tree = CreateOrganizationsTree(organizations as OrganizationWithDepth[])
  const typeOptions =
    userRole === UserRolesEnum.SuperAdmin ? industryLevelOptions : unitLevelOptions

  // Memoize the fields to recreate them when filteredUsers changes
  const fields = useMemo(
    () => [
      {
        label: 'Name',
        name: 'name' as const,
        type: 'text' as const,
      },
      {
        label: 'Type',
        name: 'type' as const,
        type: 'select' as const,
        options: typeOptions,
      },
      {
        label: 'Parent',
        name: 'parent' as const,
        type: 'tree-select' as const,
        options: organizations.map((org) => ({
          value: org.id.toString(),
          label: org.name,
        })),
        tree: tree,
      },
      {
        label: 'Admin',
        name: 'admin' as const,
        type: 'select' as const,
        options: filteredUsers.map((user) => ({
          value: user.id.toString(),
          label: user.name,
        })),
      },
      {
        label: 'Backup Admins',
        name: 'backupAdmins' as const,
        type: 'multiselect' as const,
        options: filteredUsers.map((user) => ({
          value: user.id.toString(),
          label: user.name,
        })),
      },
      {
        label: 'Email',
        name: 'email' as const,
        type: 'text' as const,
      },
      {
        label: 'Phone',
        name: 'phone' as const,
        type: 'text' as const,
      },
      {
        label: 'Status',
        name: 'status' as const,
        type: 'select' as const,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'pending_review', label: 'Pending Review' },
        ],
      },
      {
        label: 'Description',
        name: 'description' as const,
        type: 'textarea' as const,
      },
      {
        label: 'Delegated Permissions',
        name: 'delegatedPermissions' as const,
        type: 'checkbox' as const,
        checkboxMode: 'boolean' as const,
      },
    ],
    [filteredUsers, organizations, tree, typeOptions],
  )

  const { formComponent, form } = useFormHelper(
    {
      schema: createOrgFormSchema,
      fields,
      onSubmit: async (submitData) => {
        try {
          await createOrganization(submitData)
          form.reset()
          toast.success('Organization created successfully')
          router.push('/dashboard/organizations')
        } catch (error) {
          toast.error(
            `An error occurred while creating the organization, please try again \n(${error})`,
          )
        }
      },
    },
    {
      defaultValues: {
        name: '',
        type: OrganizationTypeEnum.HIGHER_EDUCATION_INSTITUTION,
        parent: defaultParentOrg || '',
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

  // Watch for parent organization changes and update filtered users
  const watchedParent = form.watch('parent')

  useEffect(() => {
    if (watchedParent) {
      const selectedOrg = organizations.find((org) => org.id.toString() === watchedParent)
      fetchFilteredUsers(watchedParent, selectedOrg?.name)
        .then((users) => {
          setFilteredUsers(users)
        })
        .catch((error) => {
          console.error('Error fetching filtered users:', error)
          setFilteredUsers([])
        })

      // Clear admin and backup admins when parent changes
      form.setValue('admin', '')
      form.setValue('backupAdmins', [])
    } else {
      setFilteredUsers([])
    }
  }, [watchedParent, organizations, form])

  // Initial load of filtered users when component mounts with default parent
  useEffect(() => {
    if (defaultParentOrg) {
      const selectedOrg = organizations.find((org) => org.id.toString() === defaultParentOrg)
      fetchFilteredUsers(defaultParentOrg, selectedOrg?.name)
        .then((users) => {
          setFilteredUsers(users)
        })
        .catch((error) => {
          console.error('Error fetching filtered users:', error)
          setFilteredUsers([])
        })
    }
  }, [defaultParentOrg, organizations])

  return {
    formComponent,
    form,
  }
}

export default useCreateOrganization
