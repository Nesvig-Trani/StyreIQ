'use client'

import { useFormHelper } from '@/shared'
import { useRouter } from 'next/navigation'

import { ComplianceTask } from '@/types/payload-types'
import { toast } from 'sonner'
import { completeTwoFactorTask } from '@/sdk/compliance-task'
import { twoFactorSchema } from '../schema'

export function useTwoFactorForm(task: ComplianceTask) {
  const router = useRouter()

  const { formComponent, form } = useFormHelper(
    {
      schema: twoFactorSchema,
      fields: [
        {
          label:
            'I confirm that two-factor authentication (2FA) is enabled on all social media accounts I manage.',
          name: 'confirmation',
          type: 'checkbox',
          checkboxMode: 'boolean',
          size: 'full',
        },
      ],
      onSubmit: async () => {
        try {
          await completeTwoFactorTask(task.id)
          toast.success('2FA confirmation recorded successfully')
          router.push('/dashboard/compliance')
        } catch {
          toast.error('Failed to complete task')
        }
      },
      onCancel: () => router.push('/dashboard/compliance'),
      showCancel: true,
      cancelContent: 'Cancel',
      submitContent: 'Confirm 2FA Enabled',
    },
    {
      defaultValues: {
        confirmation: false,
      },
    },
  )

  return { formComponent, form }
}
