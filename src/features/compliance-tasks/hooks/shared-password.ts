'use client'

import { useFormHelper } from '@/shared'
import { useRouter } from 'next/navigation'

import { ComplianceTask } from '@/types/payload-types'
import { toast } from 'sonner'
import { completeSharedPasswordTask } from '@/sdk/compliance-task'
import { sharedPasswordSchema } from '../schema'

export function useSharedPasswordForm(task: ComplianceTask) {
  const router = useRouter()

  const { formComponent, form } = useFormHelper(
    {
      schema: sharedPasswordSchema,
      fields: [
        {
          label:
            'I confirm the shared credential was updated and shared securely with authorized team members.',
          name: 'confirmation',
          type: 'checkbox',
          checkboxMode: 'boolean',
          size: 'full',
        },
      ],
      onSubmit: async () => {
        try {
          await completeSharedPasswordTask(task.id)
          toast.success('Shared password confirmation recorded successfully')
          router.push('/dashboard/compliance')
        } catch {
          toast.error('Failed to complete task')
        }
      },
      onCancel: () => router.push('/dashboard/compliance'),
      showCancel: true,
      cancelContent: 'Cancel',
      submitContent: 'Confirm Shared Password Update',
    },
    {
      defaultValues: {
        confirmation: false,
      },
    },
  )

  return { formComponent, form }
}
