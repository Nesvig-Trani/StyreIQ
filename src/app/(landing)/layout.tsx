import React from 'react'

export const metadata = {
  description: 'StyreIQ - Social Media Risk Management Platform',
  title: 'StyreIQ',
}

export default async function LandingLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return <>{children}</>
}
