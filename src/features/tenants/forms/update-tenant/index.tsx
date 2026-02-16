'use client'

import { useUpdateTenant } from '../../hooks/useUpdateTenant'
import { Tenant } from '@/types/payload-types'

interface UpdateTenantFormProps {
  tenantId: number
  initialData: Tenant | null
}

export const UpdateTenantForm: React.FC<UpdateTenantFormProps> = ({ tenantId, initialData }) => {
  const { formComponent } = useUpdateTenant({ tenantId, initialData })

  return <div>{formComponent}</div>
}

export default UpdateTenantForm
