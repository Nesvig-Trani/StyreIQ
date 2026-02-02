import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useFormHelper } from '@/shared'
import { createRoleRequestFormSchema } from '../schemas'
import { UserRolesEnum, roleLabelMap } from '@/features/users/schemas'
import { createRoleRequest } from '@/sdk/request-role'
import { normalizeRoles } from '@/shared/utils/role-hierarchy'
import { User, Organization } from '@/types/payload-types'
import { useMemo } from 'react'
import { createUnitTree, UnitWithDepth } from '@/features/units'

interface UseCreateRoleRequestProps {
  currentUser: User
  organizations: Organization[]
}

export function useCreateRoleRequest({ currentUser, organizations }: UseCreateRoleRequestProps) {
  const router = useRouter()

  const userRoles = normalizeRoles(currentUser.roles)

  const allRequestableRoles = [
    UserRolesEnum.CentralAdmin,
    UserRolesEnum.UnitAdmin,
    UserRolesEnum.SocialMediaManager,
  ]

  const availableRoles = allRequestableRoles.filter((role) => !userRoles.includes(role))

  const roleOptions = availableRoles.map((role) => ({
    label: roleLabelMap[role],
    value: role,
  }))

  const tree = useMemo(() => createUnitTree(organizations as UnitWithDepth[]), [organizations])

  const { formComponent, form } = useFormHelper(
    {
      schema: createRoleRequestFormSchema,
      fields: [
        {
          label: 'Role Requested',
          name: 'requestedRole',
          type: 'select',
          options: roleOptions,
          placeholder: 'Select a role',
          size: 'half',
          required: true,
        },
        {
          label: 'Unit',
          name: 'organization',
          type: 'tree-select',
          options: organizations.map((org) => ({
            value: org.id.toString(),
            label: org.name,
          })),
          tree,
          multiple: false,
          placeholder: 'Select organization',
          size: 'half',
          required: true,
        },
        {
          label: 'Justification',
          name: 'justification',
          type: 'textarea',
          placeholder: 'Explain why you need this additional role... (minimum 20 characters)',
          size: 'full',
          required: true,
        },
      ],
      onSubmit: async (submitData) => {
        try {
          await createRoleRequest(submitData)
          form.reset()
          toast.success('Role request submitted successfully')
          router.push('/dashboard/role-request')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to submit request')
        }
      },
      onCancel: () => router.push('/dashboard/role-request'),
      showCancel: true,
      cancelContent: 'Cancel',
    },
    {
      defaultValues: {
        requestedRole: availableRoles[0] || UserRolesEnum.SocialMediaManager,
        organization: '',
        justification: '',
      },
    },
  )

  return {
    formComponent,
    form,
    availableRoles,
  }
}
