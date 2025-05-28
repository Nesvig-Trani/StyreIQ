import { useFormHelper } from '@/shared/components/form-hook-helper'
import {
  CreateUserFormProps,
  createUserFormSchema,
  roleLabelMap,
  statusLabelMap,
  UserRolesEnum,
  UserStatusEnum,
} from '@/users'
import { createUser } from '@/sdk/users'
import { toast } from 'sonner'
import { isApiError } from '@/shared/utils/isApiError'
import { redirect } from 'next/navigation'
import { OrganizationWithChildren } from '@/organizations'
import { CreateOrganizationsTree } from '@/organizations/utils/createOrgTree'

function useCreateUserForm({ organizations }: CreateUserFormProps) {
  const tree = CreateOrganizationsTree(organizations as OrganizationWithChildren[])

  const { formComponent, form } = useFormHelper(
    {
      schema: createUserFormSchema,
      fields: [
        {
          label: 'Email',
          name: 'email',
          type: 'text',
        },
        {
          label: 'Password',
          name: 'password',
          type: 'password',
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
          await createUser(submitData)
          form.reset()
          toast.success('User created successfully')
        } catch (error) {
          if (isApiError(error)) {
            if (error.data?.message === 'A user with the given email is already registered.') {
              toast('User already exists, update the user instead')
              redirect(`/dashboard/users/update/${error.data.details}`)
            } else {
              toast.error('An error occurred while creating the user, please try again')
            }
          } else {
            toast.error('An unexpected error occurred')
            console.error(error)
          }
        }
      },
      submitContent: 'Create user',
    },
    {
      defaultValues: {
        name: '',
        role: undefined,
        status: undefined,
        organization: undefined,
      },
    },
  )

  return {
    formComponent,
    form,
  }
}

export default useCreateUserForm
