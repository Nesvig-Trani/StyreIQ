'use client'

import { useFormHelper } from '@/shared'
import { useRouter } from 'next/navigation'

import { ComplianceTask } from '@/types/payload-types'
import { toast } from 'sonner'
import { completeUserPasswordTask } from '@/sdk/compliance-task'
import { userPasswordSchema } from '../schema'

export function useUserPasswordForm(task: ComplianceTask) {
  const router = useRouter()

  const { formComponent, form } = useFormHelper(
    {
      schema: userPasswordSchema,
      fields: [
        {
          label:
            'I confirm that I have updated my user password according to organizational requirements.',
          name: 'confirmation',
          type: 'checkbox',
          checkboxMode: 'boolean',
          size: 'full',
        },
      ],
      onSubmit: async () => {
        try {
          await completeUserPasswordTask(task.id)
          toast.success('Password confirmation recorded successfully')
          router.push('/dashboard/compliance')
        } catch {
          toast.error('Failed to complete task')
        }
      },
      onCancel: () => router.push('/dashboard/compliance'),
      showCancel: true,
      cancelContent: 'Cancel',
      submitContent: 'Confirm Password Update',
    },
    {
      defaultValues: {
        confirmation: false,
      },
    },
  )

  return { formComponent, form }
}
