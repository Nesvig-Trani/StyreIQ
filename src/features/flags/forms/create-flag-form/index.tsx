'use client'
import { useCreateFlag } from '../../hooks/useCreateFlag'
import { SocialMedia, User, Organization } from '@/types/payload-types'

interface CreateFlagFormProps {
  users: User[]
  socialMedias: SocialMedia[]
  organizations: Organization[]
  selectedTenantId: number | null
}

export const CreateFlagForm: React.FC<CreateFlagFormProps> = ({
  users,
  socialMedias,
  organizations,
  selectedTenantId,
}) => {
  const { formComponent } = useCreateFlag({
    users,
    socialMedias,
    organizations,
    selectedTenantId,
  })

  return <div>{formComponent}</div>
}

export default CreateFlagForm
