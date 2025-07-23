import { useFormHelper } from '@/shared/components/form-hook-helper'
import { createOrgFormSchema, OrganizationTypeEnum, UpdateOrgFormProps } from '@/organizations'
import { updateOrganization } from '@/sdk/organization'
import { toast } from 'sonner'
import { CreateOrganizationsTree } from '@/organizations/utils/createOrgTree'
import { organizationTypeOptions } from '../constants/organizationTypeOptions'

function useUpdateOrganization({ users, data, organizations }: UpdateOrgFormProps) {
  const tree = CreateOrganizationsTree(organizations)
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
          options: organizationTypeOptions,
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
          if (data && data.id) {
            await updateOrganization({ ...submitData, id: data.id })
            form.reset()
            toast.success('Organization updated successfully')
          }
        } catch {
          toast.error('An error occurred while updating the organization, please try again')
        }
      },
    },
    {
      values: {
        name: data?.name || '',
        type: data?.type as OrganizationTypeEnum,
        parent: data?.parentOrg?.toString(),
        admin: data?.admin.id?.toString() || '',
        email: data?.email || '',
        phone: data?.phone || '',
        status: data?.status || 'active',
        description: data?.description || '',
        delegatedPermissions: data?.delegatedPermissions || false,
        backupAdmins: data?.backupAdmins?.map((ba) => ba.id.toString()),
      },
    },
  )

  return {
    formComponent,
    form,
  }
}

export default useUpdateOrganization
