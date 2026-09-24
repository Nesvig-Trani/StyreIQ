import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createFlagSchema, FlagTypeEnum } from '../schemas'
import { createFlag } from '@/sdk/flags'
import { toast } from 'sonner'
import { SocialMedia, User, Organization } from '@/types/payload-types'
import { useFormHelper } from '@/shared'
import { affectedEntityOptions } from '../constants/affectedEntityOptions'
import { flagTypeLabels } from '../constants/flagTypeLabels'
import { platformOptions } from '@/features/social-medias/constants/platformOptions'

const ENTITY_FLAG_TYPES = [
  FlagTypeEnum.SECURITY_CONCERN,
  FlagTypeEnum.OPERATIONAL_ISSUE,
  FlagTypeEnum.OTHER,
]

const MANUAL_FLAG_TYPE_OPTIONS = [...ENTITY_FLAG_TYPES, FlagTypeEnum.LOST_INACCESSIBLE_ACCOUNT].map(
  (flagType) => ({ value: flagType, label: flagTypeLabels[flagType] }),
)

interface CreateFlagFormProps {
  users: User[]
  socialMedias: SocialMedia[]
  organizations: Organization[]
  selectedTenantId: number | null
}

export function useCreateFlag({
  users,
  socialMedias,
  organizations,
  selectedTenantId,
}: CreateFlagFormProps) {
  const router = useRouter()

  const { formComponent, form } = useFormHelper(
    {
      schema: createFlagSchema,
      fields: [
        {
          label: 'Flag Type',
          name: 'flagType',
          type: 'select',
          options: MANUAL_FLAG_TYPE_OPTIONS,
          placeholder: 'Select flag type',
          size: 'half',
          required: true,
        },
        {
          label: 'Affected Entity Type',
          name: 'affectedEntityType',
          type: 'select',
          options: affectedEntityOptions,
          placeholder: 'Select entity type',
          size: 'half',
          dependsOn: {
            field: 'flagType',
            value: ENTITY_FLAG_TYPES,
          },
          required: true,
        },
        {
          label: 'Affected User',
          name: 'affectedEntity',
          type: 'select',
          options: users.map((user) => ({
            value: user.id.toString(),
            label: user.name || user.email,
          })),
          placeholder: 'Select affected user',
          size: 'half',
          dependsOn: {
            field: 'affectedEntityType',
            value: 'users',
          },
          required: true,
        },
        {
          label: 'Affected Social Media Account',
          name: 'affectedEntity',
          type: 'select',
          options: socialMedias.map((sm) => ({
            value: sm.id.toString(),
            label: sm.name,
          })),
          placeholder: 'Select affected social media account',
          size: 'half',
          dependsOn: {
            field: 'affectedEntityType',
            value: 'social-medias',
          },
          required: true,
        },
        {
          label: 'Affected Organizational Unit',
          name: 'affectedEntity',
          type: 'select',
          options: organizations.map((org) => ({
            value: org.id.toString(),
            label: org.name,
          })),
          placeholder: 'Select affected organizational unit',
          size: 'half',
          dependsOn: {
            field: 'affectedEntityType',
            value: 'organization',
          },
          required: true,
        },
        {
          label: 'Account URL',
          name: 'accountUrl',
          type: 'text',
          placeholder: 'https://',
          size: 'half',
          dependsOn: {
            field: 'flagType',
            value: FlagTypeEnum.LOST_INACCESSIBLE_ACCOUNT,
          },
          required: true,
        },
        {
          label: 'Platform',
          name: 'accountPlatform',
          type: 'select',
          options: platformOptions,
          placeholder: 'Select platform',
          size: 'half',
          dependsOn: {
            field: 'flagType',
            value: FlagTypeEnum.LOST_INACCESSIBLE_ACCOUNT,
          },
          required: true,
        },
        {
          label: 'Access Issue',
          name: 'accessIssue',
          type: 'textarea',
          placeholder: 'Why can the account not be accessed?',
          size: 'half',
          dependsOn: {
            field: 'flagType',
            value: FlagTypeEnum.LOST_INACCESSIBLE_ACCOUNT,
          },
          required: true,
        },
        {
          label: 'Organizational Unit',
          name: 'organization',
          type: 'select',
          options: organizations.map((org) => ({
            value: org.id.toString(),
            label: org.name,
          })),
          placeholder: 'Select the unit that owns the account',
          size: 'half',
          dependsOn: {
            field: 'flagType',
            value: FlagTypeEnum.LOST_INACCESSIBLE_ACCOUNT,
          },
        },
        {
          label: 'Assigned To',
          name: 'assignedTo',
          type: 'select',
          options: users.map((user) => ({
            value: user.id.toString(),
            label: user.name || user.email,
          })),
          placeholder: 'Select person responsible for reviewing this flag',
          size: 'half',
          required: true,
        },
        {
          label: 'Due Date',
          name: 'dueDate',
          type: 'date',
          placeholder: 'Select due date',
          size: 'half',
          required: true,
        },
        {
          label: 'Risk Description',
          name: 'description',
          type: 'textarea',
          placeholder: 'Describe the risk or issue',
          size: 'half',
        },
        {
          label: 'Suggested Action',
          name: 'suggestedAction',
          type: 'textarea',
          placeholder: 'What action should be taken?',
          size: 'half',
        },
      ],
      onSubmit: async (submitData) => {
        const dataWithTenant = {
          ...submitData,
          tenant: selectedTenantId,
        }
        await createFlag(dataWithTenant)
        form.reset()
        toast.success('Risk flag created successfully')
        router.push('/dashboard/flags')
      },
      onCancel: () => router.push('/dashboard/flags'),
      showCancel: true,
      cancelContent: 'Cancel',
    },
    {
      defaultValues: {
        flagType: undefined,
        affectedEntityType: undefined,
        affectedEntity: '',
        accountUrl: '',
        accountPlatform: undefined,
        accessIssue: '',
        organization: '',
        assignedTo: '',
        dueDate: '',
        description: '',
        suggestedAction: '',
      },
    },
  )

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'affectedEntityType') {
        form.setValue('affectedEntity', '')
      }
      if (name !== 'flagType') return

      if (value.flagType === FlagTypeEnum.LOST_INACCESSIBLE_ACCOUNT) {
        form.setValue('affectedEntityType', undefined)
        form.setValue('affectedEntity', '')
      } else {
        form.setValue('accountUrl', '')
        form.setValue('accountPlatform', undefined)
        form.setValue('accessIssue', '')
        form.setValue('organization', '')
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  return {
    formComponent,
    form,
  }
}
