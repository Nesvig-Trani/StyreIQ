import { useFormHelper } from '@/shared/components/form-hook-helper'

import { useRouter } from 'next/navigation'

import {
  createUserFormSchema,
  roleLabelMap,
  statusLabelMap,
  UserRolesEnum,
  UserStatusEnum,
} from '../../schemas'
import { Organization } from '@/types/payload-types'
import { createUnitTree, UnitWithDepth } from '@/features/units'
import { useMemo } from 'react'
import { createUser } from '@/sdk/users'
import { isApiError } from '@/shared'
import { USER_ALREADY_EXISTS } from '../../constants/Errors'
import { toast } from 'sonner'

interface UserFormProps {
  authUserRole?: UserRolesEnum | null
  initialOrganizations: Organization[]
  selectedTenantId: number | null
}

export function useCreateUserForm({
  authUserRole,
  initialOrganizations,
  selectedTenantId,
}: UserFormProps) {
  const router = useRouter()

  const allowedRoles =
    authUserRole === UserRolesEnum.UnitAdmin
      ? [UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager]
      : Object.values(UserRolesEnum)

  const allowedStatuses =
    authUserRole === UserRolesEnum.UnitAdmin ? [] : [UserStatusEnum.Active, UserStatusEnum.Inactive]

  const tree = useMemo(
    () => createUnitTree(initialOrganizations as UnitWithDepth[]),
    [initialOrganizations],
  )

  const { formComponent, form } = useFormHelper(
    {
      schema: createUserFormSchema,
      fields: [
        {
          label: 'Email',
          name: 'email',
          type: 'text',
          placeholder: 'Enter the new user’s organizational email',
          size: 'half',
        },
        {
          label: 'Name',
          name: 'name',
          type: 'text',
          placeholder: 'Enter the new user’s full name',
          size: 'half',
        },
        {
          label: 'Password',
          name: 'password',
          type: 'password',
          placeholder: 'Leave blank. The user will set their StyreIQ login password',
          size: 'half',
        },
        {
          label: 'Roles',
          name: 'roles',
          type: 'multiselect',
          options: allowedRoles.map((role) => ({
            label: roleLabelMap[role],
            value: role,
          })),
          size: 'half',
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: allowedStatuses.map((status) => ({
            label: statusLabelMap[status],
            value: status,
          })),
          placeholder: 'Select status',
          size: 'half',
          hidden: authUserRole === UserRolesEnum.UnitAdmin,
        },
        {
          label: 'Organization',
          name: 'organizations',
          type: 'tree-select',
          options: initialOrganizations.map((org) => ({
            value: org.id.toString(),
            label: org.name,
          })),
          tree,
          multiple: true,
          dependsOn: {
            field: 'roles',
            value: [
              UserRolesEnum.CentralAdmin,
              UserRolesEnum.UnitAdmin,
              UserRolesEnum.SocialMediaManager,
            ],
          },
          size: 'half',
        },
      ],
      onSubmit: async (submitData) => {
        try {
          const user = await createUser({
            ...submitData,
            tenant: selectedTenantId,
          })

          toast.success('User created successfully')

          router.push(
            user.active_role === UserRolesEnum.SuperAdmin
              ? '/dashboard/users'
              : `/dashboard/users/access/${user.id}`,
          )
        } catch (error) {
          if (isApiError(error)) {
            if (error.data?.message === USER_ALREADY_EXISTS) {
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
      onCancel: () => router.push('/dashboard/social-media-accounts/'),
      showCancel: true,
      cancelContent: 'Cancel',
    },
    {
      defaultValues: {
        email: '',
        name: '',
        password: '',
        roles: [],
        status: undefined,
        organizations: [],
      },
    },
  )

  return {
    formComponent,
    form,
  }
}
