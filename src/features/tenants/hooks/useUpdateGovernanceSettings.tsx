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
        reminderSchedule: tenant.governanceSettings.reminderSchedule || [
          { day: 3 },
          { day: 7 },
          { day: 14 },
        ],
        escalationDays: tenant.governanceSettings.escalationDays || [
          { day: 15 },
          { day: 30 },
          { day: 45 },
        ],
        rollCallFrequency: tenant.governanceSettings.rollCallFrequency || 'quarterly',
        passwordUpdateCadenceDays: tenant.governanceSettings.passwordUpdateCadenceDays || 180,
      }
    : {
        reminderSchedule: [{ day: 3 }, { day: 7 }, { day: 14 }],
        escalationDays: [{ day: 15 }, { day: 30 }, { day: 45 }],
        rollCallFrequency: 'quarterly' as const,
        passwordUpdateCadenceDays: 180,
      }

  const { formComponent, form } = useFormHelper(
    {
      schema: tenantGovernanceSettingsSchema,
      fields: [
        {
          name: 'reminderSchedule',
          label: 'Reminder Schedule',
          type: 'array',
          description:
            'Choose the day offsets when StyreIQ sends reminders to the assigned user for any open compliance task.',
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
          name: 'escalationDays',
          label: 'Escalation Days',
          type: 'array',
          description:
            'When a task is overdue, escalation notifies Unit and Central Admins based on the schedule set here.',
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
          description:
            'How often users must confirm which social media accounts they are connected to.',
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
          name: 'passwordUpdateCadenceDays',
          label: 'Password Update Cadence (Days)',
          type: 'number',
          description:
            'How often users will be asked to update passwords used to access their assigned social media accounts, whether through individual login access or shared credentials.',
          placeholder: 'Enter days (30-365)',
          size: 'half',
        },
      ],
      onSubmit: async (data) => {
        await updateGovernanceSettings(tenant.id, data)
        toast.success('Governance settings updated successfully')
        router.push('/dashboard/tenants')
      },
      onCancel: () => {
        form.reset(currentSettings)
        toast.info('Changes discarded')
      },
      showCancel: true,
      cancelContent: 'Reset to Current',
      submitContent: 'Save Changes',
    },
    {
      defaultValues: currentSettings,
    },
  )

  return {
    formComponent,
    form,
  }
}
