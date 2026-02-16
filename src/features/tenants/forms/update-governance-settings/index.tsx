'use client'
import React from 'react'

import { Tenant } from '@/types/payload-types'
import { useUpdateTenantSettings } from '@/features/tenants/hooks/useUpdateGovernanceSettings'

export const UpdateTenantSettingsForm: React.FC<{ tenant: Tenant }> = ({ tenant }) => {
  const { formComponent } = useUpdateTenantSettings({
    tenant,
  })

  return <div>{formComponent}</div>
}
