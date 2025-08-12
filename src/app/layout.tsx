import React from 'react'
import './styles.css'
import './phone-input.css'
import { Toaster } from '@/shared/components/ui/sonner'

export const metadata = {
  description: 'StyreIQ - Social Media Risk Management Platform',
  title: 'StyreIQ',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
