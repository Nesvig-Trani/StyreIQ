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
      },
    },
  )

  return {
    formComponent,
    form,
  }
}
