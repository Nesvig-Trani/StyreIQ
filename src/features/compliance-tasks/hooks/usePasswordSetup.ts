'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useFormHelper } from '@/shared'
import { ComplianceTask } from '@/types/payload-types'
import { completePasswordSetupTask } from '@/sdk/compliance-task'
import { passwordSetupSchema } from '../schema'

export function usePasswordSetupForm(task: ComplianceTask) {
  const router = useRouter()

  const { formComponent } = useFormHelper(
    {
      schema: passwordSetupSchema,
      fields: [
        {
          label: 'I confirm that I have set up a secure password that meets all requirements',
          name: 'passwordConfirmed',
          type: 'checkbox',
          checkboxMode: 'boolean',
          size: 'full',
        },
        {
          label:
            'I confirm that I have enabled two-factor authentication (2FA) on all assigned accounts',
          name: 'twoFactorConfirmed',
          type: 'checkbox',
          checkboxMode: 'boolean',
          size: 'full',
        },
      ],
      submitContent: 'Confirm Setup Completed',
      onSubmit: async () => {
        await completePasswordSetupTask(task.id)
        toast.success('Password setup confirmed successfully')
        router.push('/dashboard/compliance')
      },
      showCancel: true,
      cancelContent: 'Cancel',
      onCancel: () => router.push('/dashboard/compliance'),
    },
    {
      defaultValues: {
        passwordConfirmed: false,
        twoFactorConfirmed: false,
      },
    },
  )

  return {
    formComponent,
  }
}
