import { useFormHelper } from '@/shared/components/form-hook-helper'
import {
  roleLabelMap,
  statusLabelMap,
  UpdateUserFormProps,
  updateUserFormSchema,
  UserRolesEnum,
  UserStatusEnum,
} from '@/users'
import { updateUser } from '@/sdk/users'
import { toast } from 'sonner'
import { Organization } from '@/payload-types'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreateOrganizationsTree, OrganizationWithDepth } from '@/organizations'

function useUpdateUserForm({ organizations, id, data }: UpdateUserFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || `/dashboard/users/access/${id}`
  const tree = CreateOrganizationsTree(organizations as OrganizationWithDepth[])
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
          name: 'organizations',
          type: 'tree-select',
          options: organizations.map((org) => ({
            value: org.id.toString(),
            label: org.name,
          })),
          tree: tree,
          multiple: true,
          dependsOn: {
            field: 'role',
            value: [UserRolesEnum.SocialMediaManager, UserRolesEnum.UnitAdmin],
          },
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
        role: data.role as UserRolesEnum,
        status: data.status as UserStatusEnum,
        organizations: data.organizations?.map((org) => org.toString()),
      },
    },
  )

  return {
    formComponent,
  }
}

export default useUpdateUserForm
