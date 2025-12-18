'use client'

import { useCreateRoleRequest } from '../hooks/useCreateRoleRequest'
import { User, Organization } from '@/types/payload-types'

interface CreateRoleRequestFormProps {
  currentUser: User
  organizations: Organization[]
}

export default function CreateRoleRequestForm({
  currentUser,
  organizations,
}: CreateRoleRequestFormProps) {
  const { formComponent } = useCreateRoleRequest({
    currentUser,
    organizations,
  })

  return <div>{formComponent}</div>
}
