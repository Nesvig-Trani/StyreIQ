import Link from 'next/link'
import { Linkedin, Mail } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '@/shared/utils/cn'

const footerLinkInteract =
  'rounded-md outline-none ring-offset-2 ring-offset-gray-900 transition-colors focus-visible:ring-2 focus-visible:ring-white/70'

export const Footer: React.FC<{
  showGetStarted: boolean
}> = () => {
  useEffect(() => {
    // Note: Using useEffect instead of next/script because we need cleanup
    // when navigating away from landing page to prevent Iubenda widget
    // from persisting in dashboard
    if (!document.querySelector('script[src*="iubenda.com/widgets"]')) {
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = 'https://embeds.iubenda.com/widgets/90e807c6-0330-4bac-8f10-32cf1c362c8e.js'
      script.async = true
      script.id = 'iubenda-script'
      document.head.appendChild(script)
    }

    return () => {
      const script = document.getElementById('iubenda-script')
      if (script) {
        script.remove()
      }

      const widget = document.querySelector('.iubenda-cs-container')
      if (widget) {
        widget.remove()
      }

      const iubendaElements = document.querySelectorAll('[class*="iubenda"]')
      iubendaElements.forEach((el) => {
        if (!el.closest('footer')) {
          el.remove()
        }
      })
    }
  }, [])
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-4">
          <div></div>
          <div className="flex items-center gap-3">
            <a
              href="mailto:info@styreiq.com"
              className={cn(
                footerLinkInteract,
                'inline-flex size-11 min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center',
                'text-gray-400 hover:text-white focus-visible:text-white',
              )}
              aria-label="Send email to StyreIQ"
            >
              <Mail size={20} aria-hidden="true" />
            </a>
            <Link
              href="https://www.linkedin.com/company/nesvig-trani-llc/?viewAsMember=true"
              className={cn(
                footerLinkInteract,
                'inline-flex size-11 min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center',
                'text-gray-400 hover:text-white focus-visible:text-white',
              )}
              aria-label="StyreIQ on LinkedIn"
            >
              <Linkedin size={20} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-2">
              <Link
                href="/"
                className={cn(
                  footerLinkInteract,
                  'text-xl font-bold text-white hover:text-gray-300 focus-visible:text-gray-300',
                )}
              >
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
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4 text-sm">
            <a
              href="https://www.iubenda.com/privacy-policy/68492162"
              className={cn(
                footerLinkInteract,
                'text-gray-400 hover:text-white focus-visible:text-white iubenda-nostyle no-brand iubenda-embed',
              )}
            >
              Privacy Policy & Cookie Policy
            </a>
            <span className="hidden sm:inline text-gray-600">•</span>
            <button
              className={cn(
                footerLinkInteract,
                'text-gray-400 hover:text-white focus-visible:text-white iubenda-cs-preferences-link',
              )}
              type="button"
            >
              Cookie Preferences
            </button>
            <span className="hidden sm:inline text-gray-600">•</span>
            <Link
              href="/terms-and-conditions"
              className={cn(
                footerLinkInteract,
                'text-gray-400 hover:text-white focus-visible:text-white',
              )}
            >
              Terms and Conditions of Sale
            </Link>
          </div>
          <p className="text-gray-400 text-sm text-center">© 2025 StyreIQ All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
