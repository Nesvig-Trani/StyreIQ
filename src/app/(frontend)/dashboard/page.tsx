import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { env } from '@/config/env'

export default async function DashboardPage() {
  const headers = await getHeaders()

  const res = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users/me`, {
    headers: {
      cookie: headers.get('cookie') || '',
    },
    cache: 'no-store',
  })

  const admin = await res.json()

  if (!admin) {
    redirect('/login')
  }

  return (
    <div>
      <h1>Welcome to dashboard</h1>
    </div>
  )
}
