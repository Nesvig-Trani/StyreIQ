import { CreateFlagForm } from '@/flags/forms/create-flag-form'
import { getAllSocialMediaAccounts } from '@/plugins/social-medias/queries'
import { getAllUsers } from '@/users'

export default async function CreateFlagPage() {
  const users = await getAllUsers()
  const socialMedias = await getAllSocialMediaAccounts()
  return (
    <div>
      <CreateFlagForm users={users.docs} socialMedias={socialMedias.docs} />
    </div>
  )
}
