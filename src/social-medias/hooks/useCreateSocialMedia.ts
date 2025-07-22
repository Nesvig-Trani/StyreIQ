'use client'
import { useFormHelper } from '@/shared/components/form-hook-helper'
import { OrganizationWithDepth } from '@/organizations'
import { CreateSocialMediaFormProps, createSocialMediaFormSchema } from '@/social-medias'
import { createSocialMedia } from '@/sdk/social-medias'
import { toast } from 'sonner'
import { CreateOrganizationsTree } from '@/organizations/utils/createOrgTree'
import { EndpointError } from '@/shared'
import { useRouter } from 'next/navigation'
import { platformOptions } from '@/social-medias/constants/platformOptions'

export function useCreateSocialMedia({ users, organizations }: CreateSocialMediaFormProps) {
  const tree = CreateOrganizationsTree(organizations as OrganizationWithDepth[])
  const router = useRouter()
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
          type: 'select',
          options: platformOptions,
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
        contactEmail: undefined,
        contactPhone: undefined,
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
