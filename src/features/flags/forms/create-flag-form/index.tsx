'use client'
import { useCreateFlag } from '../../hooks/useCreateFlag'
import { SocialMedia, User } from '@/types/payload-types'

interface CreateFlagFormProps {
  users: User[]
  socialMedias: SocialMedia[]
  selectedTenantId: number | null
}

export const CreateFlagForm: React.FC<CreateFlagFormProps> = ({
  users,
  socialMedias,
  selectedTenantId,
}) => {
  const { formComponent } = useCreateFlag({
    users,
    socialMedias,
    selectedTenantId,
  })

  return <div>{formComponent}</div>
}

export default CreateFlagForm
