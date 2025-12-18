'use client'

import { Organization } from '@/types/payload-types'
import { UserRolesEnum } from '../../schemas'
import { useCreateUserForm } from './use-create-user-form'

interface UserFormProps {
  authUserRole?: UserRolesEnum | null
  initialOrganizations: Organization[]
  selectedTenantId: number | null
}

export const CreateUserForm: React.FC<UserFormProps> = ({
  authUserRole,
  initialOrganizations,
  selectedTenantId,
}) => {
  const { formComponent } = useCreateUserForm({
    authUserRole,
    initialOrganizations,
    selectedTenantId,
  })

  return <div>{formComponent}</div>
}
