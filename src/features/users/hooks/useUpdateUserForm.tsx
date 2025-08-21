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

function useUpdateUserForm({ organizations, id, data }: UpdateUserFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || `/dashboard/users/access/${id}`
  const tree = createUnitTree(organizations as UnitWithDepth[])
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
        },
        {
          label: 'Name',
          name: 'name',
          type: 'text',
          placeholder: 'Enter your name',
          size: 'half',
        },
        {
          label: 'Role',
          name: 'role',
          type: 'select',
          options: Object.values(UserRolesEnum).map((role) => ({
            label: roleLabelMap[role],
            value: role,
          })),
          size: 'half',
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
          size: 'half',
        },
        {
          label: 'Recent Password Update',
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
          label: 'Is enabled two factor authentication?',
          name: 'isEnabledTwoFactor',
          type: 'select',
          options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ],
          size: 'half',
        },

        {
          label: 'Are you using a secure password?',
          name: 'isInUseSecurePassword',
          type: 'select',
          options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ],
          size: 'half',
        },
        {
          label: 'Have you completed accessibility training?',
          name: 'isCompletedTrainingAccessibility',
          type: 'select',
          options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ],
          size: 'half',
        },
        {
          label: 'Have you completed risk mitigation training?',
          name: 'isCompletedTrainingRisk',
          type: 'select',
          options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ],
          size: 'half',
        },
        {
          label: 'Have you completed brand and identity usage training?',
          name: 'isCompletedTrainingBrand',
          type: 'select',
          options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ],
          size: 'half',
        },
        {
          label: 'Do you have acknowledgment of naming and branding standards?',
          name: 'hasKnowledgeStandards',
          type: 'select',
          options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ],
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
        role: data.role as UserRolesEnum,
        status: data.status as UserStatusEnum,
        organizations: data.organizations?.map((org) => org.toString()),
        isEnabledTwoFactor: data.isEnabledTwoFactor || false,
        isInUseSecurePassword: data.isInUseSecurePassword || false,
        isCompletedTrainingAccessibility: data.isCompletedTrainingAccessibility || false,
        isCompletedTrainingRisk: data.isCompletedTrainingRisk || false,
        isCompletedTrainingBrand: data.isCompletedTrainingBrand || false,
        hasKnowledgeStandards: data.hasKnowledgeStandards || false,
        passwordUpdatedAt: data.passwordUpdatedAt ? new Date(data.passwordUpdatedAt) : undefined,
      },
    },
  )

  return {
    formComponent,
  }
}

export default useUpdateUserForm
