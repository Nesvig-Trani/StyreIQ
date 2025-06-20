import { useFormHelper } from '@/shared/components/form-hook-helper'
import { OrganizationWithDepth } from '@/organizations'
import { CreateSocialMediaFormProps, createSocialMediaFormSchema } from '@/social-medias'
import { createSocialMedia } from '@/sdk/social-medias'
import { toast } from 'sonner'
import { CreateOrganizationsTree } from '@/organizations/utils/createOrgTree'
import { EndpointError } from '@/shared'

export function useCreateSocialMedia({ users, organizations }: CreateSocialMediaFormProps) {
  const tree = CreateOrganizationsTree(organizations as OrganizationWithDepth[])

  const { formComponent, form } = useFormHelper(
    {
      schema: createSocialMediaFormSchema,
      fields: [
        {
          label: 'Name *',
          name: 'name',
          type: 'text',
        },
        {
          label: 'Profile URL *',
          name: 'profileUrl',
          type: 'text',
        },
        {
          label: 'Platform *',
          name: 'platform',
          type: 'text',
        },
        {
          label: 'Contact Email',
          name: 'contactEmail',
          type: 'text',
        },
        {
          label: 'Contact Phone',
          name: 'contactPhone',
          type: 'text',
        },
        {
          label: 'Recent Password Update',
          name: 'passwordUpdatedAt',
          type: 'date',
        },
        {
          label: 'Is enabled two factor authentication?',
          name: 'isEnabledTwoFactor',
          type: 'checkbox',
          checkboxMode: 'boolean',
        },
        {
          label: 'Are you using a secure password?',
          name: 'isInUseSecurePassword',
          type: 'checkbox',
          checkboxMode: 'boolean',
        },
        {
          label: 'Have you accepted the institutional social media policies?',
          name: 'isAcceptedPolicies',
          type: 'checkbox',
          checkboxMode: 'boolean',
        },
        {
          label: 'Have you completed accessibility training?',
          name: 'isCompletedTrainingAccessibility',
          type: 'checkbox',
          checkboxMode: 'boolean',
        },
        {
          label: 'Have you completed risk mitigation training?',
          name: 'isCompletedTrainingRisk',
          type: 'checkbox',
          checkboxMode: 'boolean',
        },
        {
          label: 'Have you completed brand and identity usage training?',
          name: 'isCompletedTrainingBrand',
          type: 'checkbox',
          checkboxMode: 'boolean',
        },
        {
          label: 'Do you have acknowledgment of naming and branding standards?',
          name: 'hasKnowledgeStandards',
          type: 'checkbox',
          checkboxMode: 'boolean',
        },
        {
          label: 'Organization *',
          name: 'organization',
          type: 'tree-select',
          options: organizations?.map((org) => ({
            value: org.id.toString(),
            label: org.name,
          })),
          tree: tree,
        },
        {
          label: 'Administrator *',
          name: 'primaryAdmin',
          type: 'select',
          options: users.map((user) => ({
            value: user.id.toString(),
            label: user.name,
          })),
        },
        {
          label: 'Backup Administrator *',
          name: 'backupAdmin',
          type: 'select',
          options: users.map((user) => ({
            value: user.id.toString(),
            label: user.name,
          })),
        },
      ],
      onSubmit: async (submitData) => {
        try {
          await createSocialMedia(submitData)
          form.reset()
          toast.success('Social media account created successfully')
        } catch (catchError) {
          if (catchError instanceof EndpointError) {
            toast.error(catchError.message)
          } else {
            toast.error(
              'An error occurred while creating the social media account, please try again',
            )
          }
        }
      },
    },
    {
      defaultValues: {
        name: undefined,
        profileUrl: undefined,
        platform: undefined,
        contactEmail: undefined,
        contactPhone: undefined,
        passwordUpdatedAt: undefined,
        isEnabledTwoFactor: undefined,
        isInUseSecurePassword: undefined,
        isAcceptedPolicies: undefined,
        isCompletedTrainingAccessibility: undefined,
        isCompletedTrainingRisk: undefined,
        isCompletedTrainingBrand: undefined,
        hasKnowledgeStandards: undefined,
        organization: undefined,
        primaryAdmin: undefined,
        backupAdmin: undefined,
      },
    },
  )

  return {
    formComponent,
    form,
  }
}
