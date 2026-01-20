import { useRouter } from 'next/navigation'

import { toast } from 'sonner'
import { useFormHelper } from '@/shared'
import { createTenantSchema } from '../schemas'
import { createTenant } from '@/sdk/tenants'

export function useCreateTenant() {
  const router = useRouter()

  const { formComponent, form } = useFormHelper(
    {
      schema: createTenantSchema,
      fields: [
        {
          label: 'Organization Name',
          name: 'name',
          type: 'text',
          placeholder: 'e.g., University of Virginia',
          size: 'full',
        },
        {
          label: 'Domain',
          name: 'domain',
          type: 'text',
          placeholder: 'e.g., uva.edu',
          size: 'half',
        },
        {
          label: 'Admin Contact Email',
          name: 'adminContact',
          type: 'text',
          placeholder: 'e.g., admin@uva.edu',
          size: 'half',
        },
        {
          label: 'Timezone',
          name: 'timezone',
          type: 'select',
          options: [
            { label: 'Eastern Time', value: 'America/New_York' },
            { label: 'Central Time', value: 'America/Chicago' },
            { label: 'Mountain Time', value: 'America/Denver' },
            { label: 'Pacific Time', value: 'America/Los_Angeles' },
          ],
          placeholder: 'Select timezone',
          size: 'half',
        },
        {
          label: 'Enabled Trainings',
          name: 'enabledTrainings',
          type: 'array',
          children: [
            {
              name: 'trainingId',
              label: 'Training',
              type: 'select',
              options: [
                { value: 'training-governance', label: 'Governance Essentials' },
                { value: 'training-risk', label: 'Risk Mitigation' },
                { value: 'training-leadership', label: 'Leadership Guide' },
              ],
              size: 'half',
            },
            {
              name: 'assignedRoles',
              label: 'Assigned Roles',
              type: 'multiselect',
              options: [
                { value: 'social_media_manager', label: 'Social Media Manager' },
                { value: 'unit_admin', label: 'Unit Admin' },
                { value: 'central_admin', label: 'Central Admin' },
              ],
              size: 'half',
            },
          ],
          size: 'full',
        },
        {
          label: 'Internal Notes',
          name: 'notes',
          type: 'textarea',
          placeholder: 'Admin-only notes about this tenant',
          size: 'full',
        },
      ],
      onSubmit: async (submitData) => {
        await createTenant(submitData)
        form.reset()
        toast.success('Tenant created successfully')
        router.push('/dashboard/tenants')
      },
      onCancel: () => router.push('/dashboard/tenants'),
      showCancel: true,
      cancelContent: 'Cancel',
    },
    {
      defaultValues: {
        name: '',
        domain: '',
        adminContact: '',
        timezone: 'America/New_York',
        notes: '',
        enabledTrainings: [
          {
            trainingId: 'training-governance',
            assignedRoles: ['social_media_manager', 'unit_admin'],
          },
          {
            trainingId: 'training-risk',
            assignedRoles: ['social_media_manager', 'unit_admin'],
          },
          {
            trainingId: 'training-leadership',
            assignedRoles: ['unit_admin'],
          },
        ],
      },
    },
  )

  return {
    formComponent,
    form,
  }
}
