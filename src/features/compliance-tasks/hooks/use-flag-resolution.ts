'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useFormHelper } from '@/shared'
import { ComplianceTask } from '@/types/payload-types'
import { completeFlagResolutionTask } from '@/sdk/compliance-task'
import { flagResolutionSchema } from '../schema'

export function useFlagResolution(task: ComplianceTask) {
  const router = useRouter()

  const { formComponent } = useFormHelper(
    {
      schema: flagResolutionSchema,
      fields: [
        {
          label: 'Resolution Summary',
          name: 'resolutionSummary',
          type: 'textarea',
          placeholder:
            'Briefly describe what you did to address the issue. If this was discussed by email, summarize the outcome here.',
          size: 'full',
        },
        {
          label: 'I confirm that I have reviewed this risk flag and taken appropriate action.',
          name: 'confirmed',
          type: 'checkbox',
          checkboxMode: 'boolean',
          size: 'full',
        },
      ],
      submitContent: 'Mark as Completed',
      onSubmit: async (data) => {
        await completeFlagResolutionTask(task.id, data.resolutionSummary)
        toast.success('Risk flag resolved successfully')
        router.push('/dashboard/compliance')
      },
      showCancel: true,
      cancelContent: 'Cancel',
      onCancel: () => router.push('/dashboard/compliance'),
    },
    {
      defaultValues: {
        resolutionSummary: '',
        confirmed: false,
      },
    },
  )

  return {
    formComponent,
  }
}
