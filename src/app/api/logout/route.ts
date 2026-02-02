import { cookies, headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { logout } from '@/sdk/users'
import { SELECTED_TENANT_COOKIE_NAME } from '@/features/tenants/schemas'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  cookieStore.set(SELECTED_TENANT_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
  })

  const response = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  )

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"')

  return response
}
