import Link from 'next/link'
import { Button } from '@/shared'

export const Footer: React.FC<{
  showGetStarted: boolean
}> = ({ showGetStarted }) => {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-2">
              <Link href="/" className="text-xl font-bold hover:text-gray-300 transition-colors">
                StyreIQ
              </Link>
            </div>
            <p className="text-gray-400 text-sm">
              Your Social Media Governance HQ. Complete visibility, ownership tracking, and risk
              oversight for every social media account in your organization.
            </p>
            {showGetStarted && (
              <Button variant="link" className="mt-4" asChild>
                <Link href={'/login/create-first-user'}>Get Started Today</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <p className="text-gray-400 text-sm text-center">© 2025 StyreIQ All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
