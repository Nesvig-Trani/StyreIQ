import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useFormHelper } from '@/shared'
import { updateTenantSchema } from '../schemas'
import { updateTenant } from '@/sdk/tenants'
import { useTenant } from '../contexts/tenant-context'
import { useEffect } from 'react'
import { Tenant } from '@/types/payload-types'

interface UseUpdateTenantProps {
  tenantId: number
  initialData: Tenant | null
}

export function useUpdateTenant({ tenantId, initialData }: UseUpdateTenantProps) {
  const router = useRouter()
  const { refetchTenants } = useTenant()

  const { formComponent, form } = useFormHelper(
    {
      schema: updateTenantSchema,
      fields: [
        {
          label: 'Organization Name',
          name: 'name',
          type: 'text',
          placeholder: 'e.g., University of Virginia',
          size: 'full',
          required: true,
        },
        {
          label: 'Domain',
          name: 'domain',
          type: 'text',
          placeholder: 'e.g., uva.edu',
          size: 'half',
          required: true,
        },
        {
          label: 'Admin Contact Name',
          name: 'adminContactName',
          type: 'text',
          placeholder: 'e.g., name of admin contact',
          size: 'half',
          required: true,
        },
        {
          label: 'Admin Contact Email',
          name: 'adminContactEmail',
          type: 'text',
          placeholder: 'e.g., admin@uva.edu',
          size: 'half',
          required: true,
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
          required: true,
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
        await updateTenant(tenantId, submitData)
        await refetchTenants()
        toast.success('Tenant updated successfully')
        router.push('/dashboard/tenants')
      },
      onCancel: () => router.push('/dashboard/tenants'),
      showCancel: true,
      cancelContent: 'Cancel',
      submitContent: 'Update Tenant',
    },
    {
      defaultValues: initialData
        ? {
            name: initialData.name,
            domain: initialData.domain,
            adminContactName: initialData.adminContactName,
            adminContactEmail: initialData.adminContactEmail,
            timezone: initialData.metadata?.timezone || 'America/New_York',
            notes: initialData.metadata?.notes || '',
            enabledTrainings: initialData.enabledTrainings || [
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
          }
        : undefined,
    },
  )

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        domain: initialData.domain,
        adminContactName: initialData.adminContactName,
        adminContactEmail: initialData.adminContactEmail,
        timezone: initialData.metadata?.timezone || 'America/New_York',
        notes: initialData.metadata?.notes || '',
        enabledTrainings: initialData.enabledTrainings || [],
      })
    }
  }, [initialData, form])

  return {
    formComponent,
    form,
  }
}
