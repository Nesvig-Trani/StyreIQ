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
  topOrgDepth?: number
}

export function useCreateUserForm({ authUserRole, initialOrganizations }: UserFormProps) {
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
          placeholder: 'Enter the email',
          size: 'half',
        },
        {
          label: 'Name',
          name: 'name',
          type: 'text',
          placeholder: 'Enter the name',
          size: 'half',
        },
        {
          label: 'Password',
          name: 'password',
          type: 'password',
          placeholder: 'Enter the password',
          size: 'half',
        },
        {
          label: 'Role',
          name: 'role',
          type: 'select',
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
          tree: tree,
          multiple: true,
          dependsOn: {
            field: 'role',
            value: Object.values(UserRolesEnum).filter((role) => role !== UserRolesEnum.SuperAdmin),
          },
          size: 'half',
        },
        {
          label: 'Password Updated At',
          name: 'passwordUpdatedAt',
          type: 'date',
          size: 'half',
        },
        {
          name: 'isEnabledTwoFactor',
          label: '',
          type: 'separator',
          size: 'full',
        },
        {
          name: 'isEnabledTwoFactor',
          label: 'Is Enabled Two Factor',
          type: 'select',
          options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ],
          size: 'half',
        },
        {
          name: 'isInUseSecurePassword',
          label: 'Is In Use Secure Password',
          type: 'select',
          options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ],
          size: 'half',
        },
        {
          name: 'isCompletedTrainingAccessibility',
          label: 'Is Completed Training Accessibility',
          type: 'select',
          options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ],
          size: 'half',
        },
        {
          name: 'isCompletedTrainingRisk',
          label: 'Is Completed Training Risk',
          type: 'select',
          options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ],
          size: 'half',
        },
        {
          name: 'isCompletedTrainingBrand',
          label: 'Is Completed Training Brand',
          type: 'select',
          options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ],
          size: 'half',
        },
        {
          name: 'hasKnowledgeStandards',
          label: 'Has Knowledge Standards',
          type: 'select',
          options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ],
          size: 'half',
        },
      ],
      onSubmit: async (submitData) => {
        const fixed = {
          ...submitData,
        }

        try {
          const user = await createUser(fixed)
          toast.success('User created successfully')

          if (user.role === UserRolesEnum.SuperAdmin) {
            router.push('/dashboard/users')
          } else {
            router.push(`/dashboard/users/access/${user.id}`)
          }
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
        role: undefined,
        status: undefined,
        organizations: [],
        isEnabledTwoFactor: false,
        isInUseSecurePassword: false,
        isCompletedTrainingAccessibility: false,
        isCompletedTrainingRisk: false,
        isCompletedTrainingBrand: false,
        hasKnowledgeStandards: false,
        passwordUpdatedAt: undefined,
      },
    },
  )

  return {
    formComponent,
    form,
  }
}
