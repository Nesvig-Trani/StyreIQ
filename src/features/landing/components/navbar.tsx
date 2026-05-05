import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/shared'

const navJumpLink =
  'rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 focus-visible:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white'

type NavbarProps = {
  showGetStarted: boolean
}

export const Navbar: React.FC<NavbarProps> = ({ showGetStarted }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const navItems = [
    { href: '#benefits', label: 'Benefits' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#faq', label: 'FAQ' },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center rounded-md outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-gray-900/35"
            >
              <span className="ml-2 text-xl font-bold text-gray-900">StyreIQ</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className={navJumpLink}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href={'/login'}>Log In</Link>
            </Button>
            {showGetStarted && (
              <Button variant="orange" size="lg" asChild>
                <Link href={'/login/create-first-user'}>Get Started</Link>
              </Button>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              className="h-11 w-11 shrink-0 touch-manipulation"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} pb-4`}>
          <div className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} onClick={closeMobileMenu} className={navJumpLink}>
                {item.label}
              </a>
            ))}
            <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200 mt-2">
              <Button variant="ghost" asChild>
                <Link href={'/login'} onClick={closeMobileMenu}>
                  Log In
                </Link>
              </Button>
              {showGetStarted && (
                <Button asChild>
                  <Link href={'/login/create-first-user'} onClick={closeMobileMenu}>
                    Get Started
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
