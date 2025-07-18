import { cookies, headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { logout } from '@/sdk/users'

export async function GET() {
  const headers = await getHeaders()
  const cookieHeader = headers.get('cookie') || ''

  await logout({ cookie: cookieHeader })

  const cookieStore = await cookies()
  cookieStore.set('payload-token', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
  })

  return NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  )
}
