import { useFormHelper } from '@/shared/components/form-hook-helper'
import {
  roleLabelMap,
  statusLabelMap,
  UpdateUserFormProps,
  updateUserFormSchema,
  UserRolesEnum,
  UserStatusEnum,
} from '@/features/users'
import { updateUser } from '@/sdk/users'
import { toast } from 'sonner'
import { Organization } from '@/types/payload-types'
import { useRouter, useSearchParams } from 'next/navigation'
import { createUnitTree, UnitWithDepth } from '@/features/units'
import { normalizeActiveRole, normalizeRoles } from '@/shared/utils/role-hierarchy'
import { useMemo } from 'react'

function useUpdateUserForm({ organizations, id, data, authUserRole }: UpdateUserFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || `/dashboard/users`
  const tree = createUnitTree(organizations as UnitWithDepth[])

  const allowedRoles = useMemo(() => {
    switch (authUserRole) {
      case UserRolesEnum.SuperAdmin:
        return Object.values(UserRolesEnum)
      case UserRolesEnum.CentralAdmin:
        return [
          UserRolesEnum.CentralAdmin,
          UserRolesEnum.UnitAdmin,
          UserRolesEnum.SocialMediaManager,
        ]
      case UserRolesEnum.UnitAdmin:
        return [UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager]
      case UserRolesEnum.SocialMediaManager:
        return [UserRolesEnum.SocialMediaManager]
      default:
        return []
    }
  }, [authUserRole])

  const { formComponent } = useFormHelper(
    {
      schema: updateUserFormSchema,
      fields: [
        {
          label: 'Email',
          name: 'email',
          type: 'text',
          placeholder: 'Enter your email',
          size: 'half',
          required: true,
        },
        {
          label: 'Name',
          name: 'name',
          type: 'text',
          placeholder: 'Enter your name',
          size: 'half',
          required: true,
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
          required: true,
        },
        {
          label: 'Status',
          name: 'status',
          type: 'select',
          options: Object.values(UserStatusEnum).map((status) => ({
            label: statusLabelMap[status],
            value: status,
          })),
          placeholder: 'Select status',
          size: 'half',
          required: true,
        },
        {
          label: 'Organization',
          name: 'organizations',
          type: 'tree-select',
          options: organizations.map((org) => ({
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
          required: true,
        },
        {
          label: 'Recent Password Update',
          name: 'passwordUpdatedAt',
          type: 'date',
          size: 'half',
        },
      ],
      onSubmit: async (submitData) => {
        try {
          await updateUser({ ...submitData, id: Number(id) })
          router.push(returnTo)
          toast.success('User updated successfully')
        } catch (err) {
          if (typeof err === 'object' && err !== null && 'status' in err && 'data' in err) {
            const typedErr = err as {
              status: number
              data: { organizations: Organization[] }
            }

            if (typedErr.status === 409) {
              toast.warning(
                `You cannot disable this user because they are the only Unit Admin in the following organizations: ${typedErr.data.organizations
                  .map((org) => org.name)
                  .join(', ')}. Please assign another Unit Admin before disabling the user.`,
              )
              console.log('Conflicting organizations:', typedErr.data.organizations)
            }
          } else {
            toast.error('An unexpected error occurred.')
          }
        }
      },
      submitContent: 'Update User',
    },
    {
      defaultValues: {
        email: data.email,
        name: data.name,
        roles: normalizeRoles(data.roles),
        active_role: normalizeActiveRole(data.active_role),
        status: data.status as UserStatusEnum,
        organizations: data.organizations?.map((org) => org.toString()),
        passwordUpdatedAt: data.passwordUpdatedAt ? new Date(data.passwordUpdatedAt) : undefined,
      },
    },
  )

  return {
    formComponent,
  }
}

export default useUpdateUserForm
