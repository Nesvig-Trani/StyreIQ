import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { SELECTED_TENANT_COOKIE_NAME } from '@/features/tenants/schemas'
import { isLogoutReason, LOGOUT_REASON_PARAM } from '@/features/auth/utils/logoutReason'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const RSC_HEADER = 'rsc'
const HTTP_NO_CONTENT = 204

export async function GET(request: NextRequest) {
  // A server component redirect() reaches this route as a client router RSC fetch.
  // An empty non-flight response makes the router fall back to a full browser navigation,
  // so the cookie clearing and the /login redirect run as a normal page load.
  if (request.headers.get(RSC_HEADER)) {
    return new Response(null, { status: HTTP_NO_CONTENT })
  }

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

  const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  const reason = request.nextUrl.searchParams.get(LOGOUT_REASON_PARAM)
  if (isLogoutReason(reason)) {
    loginUrl.searchParams.set(LOGOUT_REASON_PARAM, reason)
  }

  const response = NextResponse.redirect(loginUrl)

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('Clear-Site-Data', '"cookies", "storage"')

  return response
}
