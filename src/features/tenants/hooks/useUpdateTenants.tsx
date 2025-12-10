import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useFormHelper } from '@/shared'
import type { Tenant } from '@/types/payload-types'
import { tenantGovernanceSettingsSchema } from '../schemas'
import { updateGovernanceSettings } from '@/sdk/tenants'

interface UseUpdateTenantSettingsProps {
  tenant: Tenant
}

export function useUpdateTenantSettings({ tenant }: UseUpdateTenantSettingsProps) {
  const router = useRouter()

  const currentSettings = tenant.governanceSettings
    ? {
        policyReminderDays: tenant.governanceSettings.policyReminderDays || [
          { day: 3 },
          { day: 7 },
          { day: 14 },
        ],
        trainingEscalationDays: tenant.governanceSettings.trainingEscalationDays || [
          { day: 15 },
          { day: 30 },
          { day: 45 },
        ],
        rollCallFrequency: tenant.governanceSettings.rollCallFrequency || 'quarterly',
        passwordRotationDays: tenant.governanceSettings.passwordRotationDays || 90,
      }
    : {
        policyReminderDays: [{ day: 3 }, { day: 7 }, { day: 14 }],
        trainingEscalationDays: [{ day: 15 }, { day: 30 }, { day: 45 }],
        rollCallFrequency: 'quarterly' as const,
        passwordRotationDays: 90,
      }

  const { formComponent, form } = useFormHelper(
    {
      schema: tenantGovernanceSettingsSchema,
      fields: [
        {
          name: 'policyReminderDays',
          label: 'Policy Reminder Days',
          type: 'array',
          children: [
            {
              name: 'day',
              label: 'Day',
              type: 'number',
              placeholder: 'Enter days (1-90)',
              size: 'full',
            },
          ],
          size: 'full',
        },
        {
          name: 'trainingEscalationDays',
          label: 'Training Escalation Days',
          type: 'array',
          children: [
            {
              name: 'day',
              label: 'Day',
              type: 'number',
              placeholder: 'Enter days (1-180)',
              size: 'full',
            },
          ],
          size: 'full',
        },
        {
          name: 'rollCallFrequency',
          label: 'Roll Call Frequency',
          type: 'select',
          options: [
            { value: 'monthly', label: 'Monthly' },
            { value: 'quarterly', label: 'Quarterly' },
            { value: 'semiannual', label: 'Semi-Annual' },
            { value: 'annual', label: 'Annual' },
          ],
          placeholder: 'Select frequency',
          size: 'half',
        },
        {
          name: 'passwordRotationDays',
          label: 'Password Rotation Days',
          type: 'number',
          placeholder: 'Enter days (30-365)',
          size: 'half',
        },
      ],
      onSubmit: async (data) => {
        await updateGovernanceSettings(tenant.id, data)
        toast.success('Governance settings updated successfully')
        router.refresh()
      },
      onCancel: () => {
        form.reset({
          policyReminderDays: currentSettings.policyReminderDays,
          trainingEscalationDays: currentSettings.trainingEscalationDays,
          rollCallFrequency: currentSettings.rollCallFrequency,
          passwordRotationDays: currentSettings.passwordRotationDays,
        })
        toast.info('Changes discarded')
      },
      showCancel: true,
      cancelContent: 'Reset to Current',
      submitContent: 'Save Changes',
    },
    {
      defaultValues: {
        policyReminderDays: currentSettings.policyReminderDays,
        trainingEscalationDays: currentSettings.trainingEscalationDays,
        rollCallFrequency: currentSettings.rollCallFrequency as
          | 'monthly'
          | 'quarterly'
          | 'semiannual'
          | 'annual',
        passwordRotationDays: currentSettings.passwordRotationDays,
      },
    },
  )

  return {
    formComponent,
    form,
  }
}
