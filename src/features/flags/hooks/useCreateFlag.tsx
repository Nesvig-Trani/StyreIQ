import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createFlagSchema } from '../schemas'
import { createFlag } from '@/sdk/flags'
import { toast } from 'sonner'
import { SocialMedia, User } from '@/types/payload-types'
import { useFormHelper } from '@/shared'
import { flagTypeOptions } from '../constants/flagTypeOptions'
import { affectedEntityOptions } from '../constants/affectedEntityOptions'

interface CreateFlagFormProps {
  users: User[]
  socialMedias: SocialMedia[]
}

export function useCreateFlag({ users, socialMedias }: CreateFlagFormProps) {
  const router = useRouter()

  const { formComponent, form } = useFormHelper(
    {
      schema: createFlagSchema,
      fields: [
        {
          label: 'Flag Type',
          name: 'flagType',
          type: 'select',
          options: flagTypeOptions,
          placeholder: 'Risk flag type',
          size: 'half',
        },
        {
          label: 'Affected Entity Type',
          name: 'affectedEntityType',
          type: 'select',
          options: affectedEntityOptions,
          placeholder: 'Select unit type',
          size: 'half',
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
        },
        {
          label: 'Affected Social Media Account',
          name: 'affectedEntity',
          type: 'select',
          options: socialMedias.map((socialMedia) => ({
            value: socialMedia.id.toString(),
            label: socialMedia.name,
          })),
          placeholder: 'Select affected social media account',
          size: 'half',
          dependsOn: {
            field: 'affectedEntityType',
            value: 'social-medias',
          },
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
        await createFlag(submitData)
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
    })
    return () => subscription.unsubscribe()
  }, [form])

  return {
    formComponent,
    form,
  }
}
