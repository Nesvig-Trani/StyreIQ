import { CreateFlagForm } from '@/features/flags/forms/create-flag-form'
import { getAllSocialMediaAccounts } from '@/features/social-medias/plugins/queries'
import { getAllUsers } from '@/features/users'

export default async function CreateFlagPage() {
  const users = await getAllUsers()
  const socialMedias = await getAllSocialMediaAccounts()
  return (
    <div>
      <CreateFlagForm users={users.docs} socialMedias={socialMedias.docs} />
    </div>
  )
}
