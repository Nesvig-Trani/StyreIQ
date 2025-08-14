import { useFormHelper } from '@/shared/components/form-hook-helper'
import { createUnitFormSchema, UnitTypeEnum, UpdateUnitFormProps } from '@/features/organizations'
import { updateUnit } from '@/sdk/organization'
import { toast } from 'sonner'
import { createUnitTree } from '@/features/organizations/utils/createUnitTree'
import { unitTypeOptions } from '../constants/unitTypeOptions'

function useUpdateOrganization({ users, data, organizations }: UpdateUnitFormProps) {
  const tree = createUnitTree(organizations)
  const { formComponent, form } = useFormHelper(
    {
      schema: createUnitFormSchema,
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
          options: unitTypeOptions,
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
            await updateUnit({ ...submitData, id: data.id })
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
        type: data?.type as UnitTypeEnum,
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
