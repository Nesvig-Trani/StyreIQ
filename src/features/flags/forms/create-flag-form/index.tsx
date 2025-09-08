'use client'
import { useCreateFlag } from '../../hooks/useCreateFlag'
import { SocialMedia, User } from '@/types/payload-types'

interface CreateFlagFormProps {
  users: User[]
  socialMedias: SocialMedia[]
}

export const CreateFlagForm: React.FC<CreateFlagFormProps> = ({ users, socialMedias }) => {
  const { formComponent } = useCreateFlag({
    users,
    socialMedias,
  })

  return <div>{formComponent}</div>
}

export default CreateFlagForm
