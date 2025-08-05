'use client'
import { useFormHelper } from '@/shared/components/form-hook-helper'
import { OrganizationWithDepth } from '@/features/organizations'
import {
  CreateSocialMediaFormProps,
  createSocialMediaFormSchema,
  linkedToolsOptions,
  passwordManagementPracticeOptions,
  thirdPartyManagementOptions,
  verificationStatusOptions,
} from '@/features/social-medias'
import { createSocialMedia } from '@/sdk/social-medias'
import { toast } from 'sonner'
import { CreateOrganizationsTree } from '@/features/organizations/utils/createOrgTree'
import { EndpointError } from '@/shared'
import { useRouter } from 'next/navigation'
import { platformOptions } from '@/features/social-medias/constants/platformOptions'

export function useCreateSocialMedia({ users, organizations }: CreateSocialMediaFormProps) {
  const tree = CreateOrganizationsTree(organizations as OrganizationWithDepth[])
  const router = useRouter()
  const { formComponent, form } = useFormHelper(
    {
      schema: createSocialMediaFormSchema,
      fields: [
        {
          label: 'Account Name *',
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
          type: 'select',
          options: platformOptions,
        },
        {
          label: 'Account Handle',
          name: 'accountHandle',
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
          label: 'Backup Administrator',
          name: 'backupAdmin',
          type: 'select',
          options: users.map((user) => ({
            value: user.id.toString(),
            label: user.name,
          })),
        },
        {
          label: 'Business Id',
          name: 'businessId',
          type: 'text',
        },
        {
          label: 'Creation Date',
          name: 'creationDate',
          type: 'date',
        },
        {
          label: 'Admin Contact Info *',
          name: 'adminContactEmails',
          type: 'multiselect',
          options: users.map((user) => ({
            value: user.email,
            label: user.email,
          })),
        },
        {
          label: 'Backup Contact Info',
          name: 'backupContactInfo',
          type: 'text',
        },
        {
          name: 'thirdPartyManagement',
          label: 'Third Party Management',
          type: 'select',
          options: thirdPartyManagementOptions,
        },
        {
          name: 'thirdPartyProvider',
          type: 'text',
          label: 'Third Party Provider *',
          size: 'full',
          dependsOn: {
            field: 'thirdPartyManagement',
            value: 'yes',
          },
        },
        {
          name: 'thirdPartyContact',
          type: 'text',
          label: 'Third Party Contact *',
          size: 'full',
          dependsOn: {
            field: 'thirdPartyManagement',
            value: 'yes',
          },
        },
        {
          name: 'passwordManagementPractice',
          type: 'select',
          label: 'Password Management Practice *',
          size: 'full',
          options: passwordManagementPracticeOptions,
        },
        {
          name: 'linkedTools',
          type: 'multiselect',
          label: 'Linked Tools',
          size: 'full',
          options: linkedToolsOptions,
        },
        {
          name: 'verificationStatus',
          type: 'select',
          label: 'Verification Status',
          size: 'full',
          options: verificationStatusOptions,
        },
        {
          name: 'platformSupportDetails',
          type: 'text',
          label: 'Platform Support Details',
          size: 'full',
        },
        {
          name: 'notes',
          type: 'textarea',
          label: 'Notes',
          size: 'full',
        },
      ],
      onSubmit: async (submitData) => {
        try {
          await createSocialMedia(submitData)
          form.reset()
          toast.success('Social media account created successfully')
          router.push('/dashboard/social-medias')
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
        accountHandle: undefined,
        contactEmail: undefined,
        contactPhone: undefined,
        organization: undefined,
        primaryAdmin: undefined,
        backupAdmin: undefined,
        businessId: undefined,
        creationDate: new Date().toISOString().split('T')[0],
        adminContactEmails: undefined,
        backupContactInfo: undefined,
        thirdPartyManagement: undefined,
        thirdPartyProvider: undefined,
        thirdPartyContact: undefined,
        passwordManagementPractice: undefined,
        linkedTools: [],
        verificationStatus: 'pending',
        platformSupportDetails: undefined,
        notes: undefined,
      },
    },
  )

  return {
    formComponent,
    form,
  }
}
