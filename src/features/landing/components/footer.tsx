import Link from 'next/link'
import { Linkedin, Mail } from 'lucide-react'

export const Footer: React.FC<{
  showGetStarted: boolean
}> = () => {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-4">
          <div></div>
          <div className="flex items-center space-x-3">
            <a
              href="mailto:info@styreiq.com"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Mail size={20} />
            </a>
            <Link
              href="https://www.linkedin.com/company/nesvig-trani-llc/?viewAsMember=true"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Linkedin size={20} />
            </Link>
          </div>
        </div>

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
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6">
          <p className="text-gray-400 text-sm text-center">© 2025 StyreIQ All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
