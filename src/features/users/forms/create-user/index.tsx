'use client'

import { Organization } from '@/types/payload-types'
import { UserRolesEnum } from '../../schemas'
import { useCreateUserForm } from './use-create-user-form'

interface UserFormProps {
  authUserRole?: UserRolesEnum | null
  initialOrganizations: Organization[]
  topOrgDepth?: number
}

export const CreateUserForm: React.FC<UserFormProps> = ({
  authUserRole,
  initialOrganizations,
  topOrgDepth,
}) => {
  const { formComponent } = useCreateUserForm({
    authUserRole,
    initialOrganizations,
    topOrgDepth,
  })

  return <div>{formComponent}</div>
}
