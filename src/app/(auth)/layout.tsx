import React from 'react'

export const metadata = {
  description: 'StyreIQ - Authentication',
  title: 'StyreIQ - Login',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-svh outline-none">
      {children}
    </main>
  )
}
