import { CreateFlagForm } from '@/features/flags/forms/create-flag-form'
import { getAllSocialMediaAccounts } from '@/features/social-medias/plugins/queries'
import { getAllUsers } from '@/features/users'
import { Card, CardContent } from '@/shared'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'

export default async function CreateFlagPage() {
  const users = await getAllUsers()
  const socialMedias = await getAllSocialMediaAccounts()
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/dashboard" className="flex items-center hover:text-gray-700">
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dashboard/flags" className="hover:text-gray-700">
            Risk Flags
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Create Risk Flag</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Risk Flag</h1>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="max-w-4xl">
              <CreateFlagForm users={users.docs} socialMedias={socialMedias.docs} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
