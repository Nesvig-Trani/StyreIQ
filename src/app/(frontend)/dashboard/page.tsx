import { headers as getHeaders } from 'next/headers.js'
import React from 'react'

export default async function DashboardPage() {
  const headers = await getHeaders()
  const res = await fetch(`http://localhost:3000/api/admins/me`, {
    headers: {
      cookie: headers.get('cookie') || '',
    },
    cache: 'no-store',
  })

  const admin = await res.json()
  console.log("admin", admin)
  return (
    <div>
      <h1>Welcome to dashboard</h1>
    </div>
  )
}
