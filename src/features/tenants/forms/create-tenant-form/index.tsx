'use client'

import { useCreateTenant } from '../../hooks/useCreateTenant'

export const CreateTenantForm: React.FC = () => {
  const { formComponent } = useCreateTenant()

  return <div>{formComponent}</div>
}

export default CreateTenantForm
