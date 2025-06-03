import { FieldDataOption, useFormHelper } from '@/shared/components/form-hook-helper'
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
import { useRouter } from 'next/navigation'

function useCreateUserForm({ organizations, user }: CreateUserFormProps) {
  const router = useRouter()
  console.log("user", user)
  const allowedRoles = Object.values(UserRolesEnum).filter((role) => {
    if (user?.role === UserRolesEnum.UnitAdmin && role === UserRolesEnum.SuperAdmin) {
      return false
    }
    return true
  })

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
          options: allowedRoles.map((role) => ({
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
          name: 'organizations',
          type: 'multiselect',
          options: organizations.map((org) => ({
            value: org.id.toString(),
            label: org.name,
          })),
        },
      ],
      onSubmit: async (submitData) => {
        try {
          const user = await createUser(submitData)
          form.reset()
          toast.success('User created successfully')
          router.push(`/dashboard/users/access/${user.id}`)
        } catch (error) {
          console.log('error', error)
          if (isApiError(error)) {
            if (error.data?.message === 'A user with the given email is already registered.') {
              toast('User already exists, update the user instead')
              router.push(`/dashboard/users/update/${error.data.details}`)
            } else {
              toast.error('An error occurred while creating the user, please try again')
            }
          } else {
            toast.error('An unexpected error occurred')
            console.error('error', error)
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
        organizations: undefined,
      },
    },
  )

  return {
    formComponent,
    form,
  }
}

export default useCreateUserForm
