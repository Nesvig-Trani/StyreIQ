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

function useCreateOrganization({
  userRole,
  users,
  organizations,
  defaultParentOrg,
}: CreateOrgFormProps) {
  const router = useRouter()
  const tree = CreateOrganizationsTree(organizations as OrganizationWithDepth[])
  const typeOptions =
    userRole === UserRolesEnum.SuperAdmin ? industryLevelOptions : unitLevelOptions
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
          options: typeOptions,
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

  return {
    formComponent,
    form,
  }
}

export default useCreateOrganization
