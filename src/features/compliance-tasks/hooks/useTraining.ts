'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useFormHelper } from '@/shared'

import { ComplianceTask } from '@/types/payload-types'
import { completeTrainingTask } from '@/sdk/compliance-task'
import { trainingSchema } from '../schema'

export function useTrainingForm(task: ComplianceTask) {
  const router = useRouter()

  const { formComponent } = useFormHelper(
    {
      schema: trainingSchema,
      fields: [
        {
          label:
            'I confirm that I have completed this training and understand my responsibilities.',
          name: 'confirmed',
          type: 'checkbox',
          checkboxMode: 'boolean',
          size: 'full',
        },
      ],
      submitContent: 'Mark Training as Completed',
      onSubmit: async () => {
        await completeTrainingTask(task.id)
        toast.success('Training completed successfully')
        router.push('/dashboard/compliance')
      },
      showCancel: true,
      cancelContent: 'Cancel',
      onCancel: () => router.push('/dashboard/compliance'),
    },
    {
      defaultValues: {
        confirmed: false,
      },
    },
  )

  return {
    formComponent,
  }
}
